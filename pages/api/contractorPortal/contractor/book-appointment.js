import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';
import User from '../../../../lib/contractorPortal/models/User';
import { createGHLAppointment } from '../../../../lib/contractorPortal/services/gohighlevel';
import jwt from 'jsonwebtoken';

// Auth middleware (same as above)
async function authenticateContractor(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'contractor' || !user.isApproved) {
      return res.status(403).json({ message: 'Contractor access required' });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      contractorTags: user.contractorTags || [],
      ...user.toObject()
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

function parseTimeSlot(timeSlot) {
  try {
    console.log('🔍 Parsing time slot:', timeSlot);

    let datePart, timePart;

    if (timeSlot.includes(' at ')) {
      const parts = timeSlot.split(' at ');
      datePart = parts[0].trim();
      timePart = parts[1].trim();
    } else if (timeSlot.includes(', ')) {
      const parts = timeSlot.split(', ');
      datePart = parts[0].trim();
      timePart = parts.slice(1).join(', ').trim();
    } else {
      throw new Error('Unrecognized time slot format');
    }

    // Parse date part
    let formattedDate;
    if (datePart.includes('/')) {
      const [month, day, year] = datePart.split('/');
      const fullYear = year.length === 2 ? `20${year}` : year;
      formattedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else {
      const currentYear = new Date().getFullYear();
      const dateWithYear = `${datePart}, ${currentYear}`;
      const parsedDate = new Date(dateWithYear);
      formattedDate = parsedDate.toISOString().split('T')[0];
    }

    return {
      date: formattedDate,
      time: timePart,
      originalTimeSlot: timeSlot
    };

  } catch (error) {
    console.error('❌ Error parsing time slot:', error);
    const today = new Date();
    const fallbackDate = today.toISOString().split('T')[0];

    return {
      date: fallbackDate,
      time: timeSlot,
      originalTimeSlot: timeSlot,
      parseError: error.message
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    // Authenticate contractor
    await new Promise((resolve, reject) => {
      authenticateContractor(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { jobId, timeSlot, notes } = req.body;

    console.log('📅 APPOINTMENT BOOKING');
    console.log('👤 Contractor:', req.user.name);
    console.log('🏗️ Job ID:', jobId);
    console.log('⏰ Time slot:', timeSlot);

    if (!jobId || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: jobId and timeSlot'
      });
    }

    // Find and validate job
    const job = await AvailableJob.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (!['available', 'unavailable'].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: 'Job is no longer available for booking'
      });
    }

    // Check if time slot is available
    const bookedTimeStrings = (job.bookedTimes || []).map(entry =>
      typeof entry === 'string' ? entry : entry.time
    );

    if (!job.availableTimes || !job.availableTimes.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Time slot not available'
      });
    }

    if (bookedTimeStrings.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Time slot already booked'
      });
    }

    // Parse time slot for GHL API
    const { date, time } = parseTimeSlot(timeSlot);

    console.log('📅 Parsed for GHL API:');
    console.log('  Date:', date);
    console.log('  Time:', time);

    // Prepare appointment data for GHL
    const appointmentData = {
      contactName: job.customerName,
      contactEmail: job.customerEmail,
      contactPhone: job.customerPhone,
      appointmentDate: date,
      appointmentTime: time,
      projectName: job.projectDescription || 'Renovation Project',
      projectDescription: `${job.projectDescription || 'Renovation consultation'}\n\nContractor: ${req.user.name}\nPhone: ${req.user.phone || 'TBD'}\nEmail: ${req.user.email}`,
      budget: job.projectBudget || 'TBD',
      notes: notes || `Job accepted by contractor: ${req.user.name} via contractor portal`
    };

    console.log('🚀 Calling GHL calendar creation...');

    // Create GHL appointment
    const ghlResult = await createGHLAppointment(appointmentData);

    console.log('📊 GHL Result:', ghlResult);

    if (ghlResult.success) {
      console.log('🎉 GHL appointment created successfully!');

      // Create appointment record
      const appointmentEntry = {
        ghlAppointmentId: ghlResult.appointmentId,
        contractorId: req.user.id.toString(),
        contractorName: req.user.name,
        contractorEmail: req.user.email,
        contractorPhone: req.user.phone,
        timeSlot: timeSlot,
        scheduledDate: date,
        scheduledTime: time,
        bookedAt: new Date(),
        status: 'confirmed',
        notes: notes
      };

      const bookingEntry = {
        time: timeSlot,
        contractorId: req.user.id,
        contractorName: req.user.name,
        contractorEmail: req.user.email,
        bookedAt: new Date()
      };

      // Check if this will be the last available time slot
      const remainingTimes = job.availableTimes.filter(t =>
        t !== timeSlot && !bookedTimeStrings.includes(t)
      );
      const isFullyBooked = remainingTimes.length === 0;

      // Update job in database
      const updateData = {
        $push: {
          bookedTimes: bookingEntry,
          appointments: appointmentEntry
        },
        $pull: {
          availableTimes: timeSlot
        }
      };

      if (isFullyBooked) {
        updateData.status = 'claimed';
        updateData.claimedBy = req.user.id;
        updateData.claimedAt = new Date();
      } else {
        updateData.status = 'available';
      }

      const updatedJob = await AvailableJob.findByIdAndUpdate(
        jobId,
        updateData,
        { new: true }
      );

      console.log('✅ Job updated successfully');

      res.json({
        success: true,
        message: isFullyBooked
          ? 'Final appointment scheduled! All time slots are now booked.'
          : 'Appointment booked successfully! Other time slots remain available.',
        appointment: appointmentEntry,
        ghlAppointmentId: ghlResult.appointmentId,
        calendarCreated: true,
        job: {
          id: updatedJob._id,
          customerName: updatedJob.customerName,
          remainingTimes: remainingTimes.length,
          status: updatedJob.status,
          fullyBooked: isFullyBooked
        }
      });

    } else {
      console.error('❌ GHL calendar creation failed:', ghlResult.error);
      res.status(207).json({
        success: false,
        message: 'GHL appointment creation failed',
        error: ghlResult.error
      });
    }

  } catch (error) {
    console.error('❌ Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: error.message
    });
  }
}