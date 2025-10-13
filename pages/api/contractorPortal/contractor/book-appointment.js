///this file: Allows authenticated contractors to book appointments for available job time slots, 
/// with automatic GoHighLevel calendar integration and comprehensive job status management.

///aka contractor appointment booking endpoint.
///this file is also also a next.js api route handler

import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';
import User from '../../../../lib/contractorPortal/models/User';
import { createGHLAppointment } from '../../../../lib/contractorPortal/services/gohighlevel';
import jwt from 'jsonwebtoken';

// Auth middleware (same as above) files, check there for explanation becuase I already documented this exact code there
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
    console.log('Parsing time slot:', timeSlot);

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
    console.error('Error parsing time slot:', error);
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

    console.log('APPOINTMENT BOOKING');
    console.log('Contractor:', req.user.name);
    console.log('Job ID:', jobId);
    console.log('Time slot:', timeSlot);

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
    // NEW: Check if job already has 3 appointments booked
    const currentAppointmentCount = (job.appointments || []).length;
    console.log(`Current appointments for job: ${currentAppointmentCount}`);

    if (currentAppointmentCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'This job has reached the maximum number of appointments (3). No more bookings are allowed.'
      });
    }

    // Check if time slot is available
    const bookedTimeStrings = (job.bookedTimes || []).map(entry =>
      typeof entry === 'string' ? entry : entry.time
    );

    // Expand ranges to match what frontend displays
    const expandedAvailableTimes = expandTimeRanges(job.availableTimes || []);
    if (!expandedAvailableTimes || !expandedAvailableTimes.includes(timeSlot)) {
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

    console.log('Parsed for GHL API:');
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

    console.log('Calling GHL calendar creation...');

    // Create GHL appointment
    const ghlResult = await createGHLAppointment(appointmentData);

    console.log('GHL Result:', ghlResult);

    if (ghlResult.success) {
      console.log('GHL appointment created successfully!');

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

      // Check if this will be the 3rd appointment (maximum reached)
      const willReachMaxAppointments = currentAppointmentCount + 1 >= 3;

      // Check if this will be the last available time slot
      const remainingTimes = expandedAvailableTimes.filter(t =>
        t !== timeSlot && !bookedTimeStrings.includes(t)
      );
      const isLastTimeSlot = remainingTimes.length === 0;

      console.log(`Will reach max appointments (3): ${willReachMaxAppointments}`);
      console.log(`Is last time slot: ${isLastTimeSlot}`);

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

      // Set status based on appointment limit OR available time slots
      if (willReachMaxAppointments || isLastTimeSlot) { ///hides job if it hits 3 bookings, or if the last remaining slot is taken
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

      console.log('Job updated successfully');

      // Determine response message
      let responseMessage;
      if (willReachMaxAppointments && isLastTimeSlot) {
        responseMessage = 'Final appointment scheduled! This job has reached both the maximum appointments (3) and all time slots are booked.';
      } else if (willReachMaxAppointments) {
        responseMessage = 'Appointment scheduled! This job has now reached the maximum number of appointments (3) and will no longer be available for booking.';
      } else if (isLastTimeSlot) {
        responseMessage = 'Final appointment scheduled! All time slots are now booked.';
      } else {
        const appointmentsRemaining = 3 - (currentAppointmentCount + 1);
        responseMessage = `Appointment booked successfully! ${appointmentsRemaining} more appointment${appointmentsRemaining !== 1 ? 's' : ''} can still be booked for this job.`;
      }

      res.json({
        success: true,
        message: responseMessage,
        appointment: appointmentEntry,
        ghlAppointmentId: ghlResult.appointmentId,
        calendarCreated: true,
        job: {
          id: updatedJob._id,
          customerName: updatedJob.customerName,
          remainingTimes: remainingTimes.length,
          appointmentCount: currentAppointmentCount + 1,
          maxAppointments: 3,
          appointmentsRemaining: 3 - (currentAppointmentCount + 1),
          status: updatedJob.status,
          fullyBooked: willReachMaxAppointments || isLastTimeSlot
        }
      });

    } else {
      console.error('GHL calendar creation failed:', ghlResult.error);

      // Check if it's a missing contact info issue
      const errorMessage = (job.customerEmail === "No email provided" || job.customerPhone === "No phone provided")
        ? 'Email not provided for homeowner in GHL, so appointment cannot be booked.'
        : 'GHL appointment creation failed';

      res.status(207).json({
        success: false,
        message: errorMessage,
        error: ghlResult.error
      });
    }

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error booking appointment',
      error: error.message
    });
  }
}
// Add these functions at the bottom of book-appointment.js
function expandTimeRanges(timeArray) {
  const expandedTimes = [];
  for (let timeEntry of timeArray) {
    if (!timeEntry || typeof timeEntry !== 'string') continue;
    timeEntry = normalizeTimeFormat(timeEntry);
    if (isTimeRange(timeEntry)) {
      const expanded = expandSingleTimeRange(timeEntry);
      expandedTimes.push(...expanded);
    } else {
      expandedTimes.push(timeEntry);
    }
  }
  return [...new Set(expandedTimes)];
}

function normalizeTimeFormat(timeStr) {
  return timeStr
    .replace(/(\d+:\d+)\s*([ap])m\b/gi, '$1 $2M')
    .replace(/\b([AP])M\b/g, '$1M');
}

function isTimeRange(timeStr) {
  return /\d+:\d+\s*[AP]M\s*(-|to)\s*\d+:\d+\s*[AP]M/i.test(timeStr);
}

function expandSingleTimeRange(timeStr) {
  try {
    const parts = timeStr.split(',');
    const datePart = parts.length > 1 ? parts[0].trim() + ', ' : '';
    const timeRangePart = parts.length > 1 ? parts[1].trim() : timeStr.trim();
    const rangeMatch = timeRangePart.match(/(\d+:\d+\s*[AP]M)\s*(-|to)\s*(\d+:\d+\s*[AP]M)/i);
    if (!rangeMatch) return [timeStr];
    const startTimeStr = rangeMatch[1].trim();
    const endTimeStr = rangeMatch[3].trim();
    const startTime24 = convertTo24Hour(startTimeStr);
    const endTime24 = convertTo24Hour(endTimeStr);
    const startHour = parseInt(startTime24.split(':')[0]);
    const endHour = parseInt(endTime24.split(':')[0]);
    const expandedSlots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      const time12h = convertTo12Hour(hour);
      expandedSlots.push(datePart + time12h);
    }
    return expandedSlots;
  } catch (error) {
    console.error('Error expanding time range:', timeStr, error);
    return [timeStr];
  }
}

function convertTo24Hour(time12h) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier.toUpperCase() === 'PM') hours = parseInt(hours, 10) + 12;
  hours = hours.toString().padStart(2, '0');
  return `${hours}:${minutes || '00'}`;
}

function convertTo12Hour(hour24) {
  const hour = hour24 % 12 || 12;
  const modifier = hour24 < 12 ? 'AM' : 'PM';
  return `${hour}:00 ${modifier}`;
}