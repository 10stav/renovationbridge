import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';
import User from '../../../../lib/contractorPortal/models/User';
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
      contractorTags: user.contractorTags || [],
      ...user.toObject()
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    console.log('📅 Fetching contractor appointments...');
    console.log('👤 Contractor:', req.user.name);
    console.log('🆔 Contractor ID:', req.user.id);

    const jobs = await AvailableJob.find({
      $or: [
        { 'appointments.contractorId': req.user.id.toString() },
        { 'bookedTimes.contractorId': req.user.id.toString() }
      ]
    }).sort({ createdAt: -1 });

    console.log('📋 Found jobs with appointments:', jobs.length);

    // Extract contractor's appointments
    const myAppointments = [];

    jobs.forEach(job => {
      // Handle bookedTimes array (where the real data is)
      const bookedTimeMatches = (job.bookedTimes || []).filter(
        booking => booking.contractorId && booking.contractorId.toString() === req.user.id.toString()
      );

      bookedTimeMatches.forEach(booking => {
        let scheduledDate = booking.scheduledDate;
        let scheduledTime = booking.scheduledTime;

        // If scheduledDate/scheduledTime are undefined, parse from the 'time' field
        if (!scheduledDate || !scheduledTime) {
          const timeString = booking.time;

          if (timeString && timeString.includes(',')) {
            const [datePart, timePart] = timeString.split(',');

            if (datePart && datePart.trim()) {
              const dateTrimed = datePart.trim();
              const [month, day, year] = dateTrimed.split('/');
              scheduledDate = `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }

            if (timePart && timePart.trim()) {
              scheduledTime = timePart.trim();
            }
          } else if (timeString) {
            scheduledTime = timeString;
          }
        }

        myAppointments.push({
          _id: booking._id,
          jobId: job._id,
          customerName: job.customerName,
          customerEmail: job.customerEmail,
          customerPhone: job.customerPhone,
          location: job.location,
          projectBudget: job.projectBudget,
          projectDescription: job.projectDescription,
          timeSlot: booking.time,
          scheduledDate: scheduledDate,
          scheduledTime: scheduledTime,
          ghlAppointmentId: booking.ghlAppointmentId,
          bookedAt: booking.bookedAt,
          status: booking.status || 'booked',
          notes: booking.notes || `Appointment with ${booking.contractorName}`
        });
      });
    });

    console.log(`📋 Found ${myAppointments.length} appointments for contractor`);

    // Convert each appointment to look like a "job" for the frontend
    const individualAppointmentJobs = myAppointments.map(appointment => ({
      _id: appointment._id,
      customerName: appointment.customerName,
      customerEmail: appointment.customerEmail,
      customerPhone: appointment.customerPhone,
      location: appointment.location,
      projectBudget: appointment.projectBudget,
      projectDescription: appointment.projectDescription,
      appointments: [{
        _id: appointment._id,
        scheduledDate: appointment.scheduledDate,
        scheduledTime: appointment.scheduledTime,
        timeSlot: appointment.timeSlot,
        ghlAppointmentId: appointment.ghlAppointmentId,
        bookedAt: appointment.bookedAt,
        status: appointment.status,
        notes: appointment.notes
      }]
    }));

    // Sort by scheduled date
    individualAppointmentJobs.sort((a, b) => {
      const dateA = new Date(a.appointments[0]?.scheduledDate || 0);
      const dateB = new Date(b.appointments[0]?.scheduledDate || 0);
      return dateA - dateB;
    });

    res.json({
      success: true,
      count: myAppointments.length,
      appointments: individualAppointmentJobs,
      contractor: {
        name: req.user.name,
        email: req.user.email
      }
    });

  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
}