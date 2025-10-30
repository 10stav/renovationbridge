///this file: Allows authenticated contractors to view available jobs that match their service tags,
/// with filtered visibility and masked customer information for privacy

///aka contractor job listing endpoint
///this file is also also a next.js api route handler
import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';
import User from '../../../../lib/contractorPortal/models/User';
import jwt from 'jsonwebtoken';

// Auth middleware
async function authenticateContractor(req, res, next) { ///this function authenticates an already logged in contractor by validating their contractor status for each api request. appears frequently. the actual login happens in auth/login.js
  const token = req.headers.authorization?.replace('Bearer ', '');
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'contractor' || !user.isActive) {
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

function maskSensitiveData(email, phone) {
  return {
    email: email ? email.replace(/(.{2})(.*)(@.*)/, '$1..........') : '',
    phone: phone ? phone.replace(/(\d{4}).*(\d{4})/, '$1.......') : ''
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {    /// req = request all data coming from client to our server. res = response that you send back to the ghl client
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

    console.log('Contractor requesting available jobs...');
    console.log('Contractor:', req.user.name);
    console.log('Contractor tags:', req.user.contractorTags);

    // Get all available jobs
    const availableJobs = await AvailableJob.find({
      status: { $in: ['available', 'unavailable'] }
    }).sort({ createdAt: -1 });

    console.log(`Found ${availableJobs.length} total available jobs`);

    // Filter by contractor tags
    const contractorTags = (req.user.contractorTags || []).map(t => t.toLowerCase().trim());

    const filteredJobs = availableJobs.filter(job => {
      const homeownerTags = job.homeownerTags || [];
      const jobTags = homeownerTags.map(t => t.toLowerCase().trim());

      console.log(`Checking job: ${job.customerName}`);
      console.log(`Homeowner tags:`, homeownerTags);

      // Special visibility flag
      if (jobTags.includes('visible-to-all')) {
        return true;
      }

      // If homeowner has NO tags, show to ALL contractors
      if (jobTags.length === 0) {
        return true;
      }

      // If homeowner has tags, only show to contractors with matching tags
      return jobTags.some(tag => contractorTags.includes(tag));
    });

    console.log(`Filtered to ${filteredJobs.length} jobs for contractor`);

    // Format jobs for frontend
    const formattedJobs = filteredJobs.map(job => {
      const bookedTimeStrings = (job.bookedTimes || []).map(entry =>
        typeof entry === 'string' ? entry : entry.time
      ); ///everything in the yellow bracket after  job => controls which jobs and which times (within those jobs) are shown to contractor in their available jobs page
      ///cont. so, the 3 above lines are setting up for this.
      ///they initialize bookedTimeStrings so we can know which times are already booked (in order to not show them)
      ///the last one of the 3 makes sure that the time entry is a string, and if not, only extracts the string part so we can use it in the coming lines to as mentioned, control which jobs and times are shown to the contractors

      // NEW: Check if maxBookings limit is reached
      const bookedAppointmentsCount = (job.bookedTimes || []).length;
      const maxBookings = job.maxBookings || 3; // Use custom field or default to 3
      console.log(`Job ${job.customerName}: ${bookedAppointmentsCount}/${maxBookings} bookings`);

      // If bookings reached the limit, don't show this job
      if (bookedAppointmentsCount >= maxBookings) {
        console.log(`Job ${job.customerName} hidden - reached limit (${bookedAppointmentsCount}/${maxBookings})`);
        return null;
      }
      ///otherwise, if 2 or less hajve been booked...
      const availableTimes = (job.availableTimes || []).filter(time =>
        !bookedTimeStrings.includes(time)///add each time that IS NOT booked into availableTimes
      );

      const { email: maskedEmail, phone: maskedPhone } = maskSensitiveData(
        job.customerEmail,
        job.customerPhone
      );

      return {
        id: job._id,
        _id: job._id,
        customerName: job.customerName,
        customerEmail: maskedEmail,
        customerPhone: maskedPhone,
        _originalEmail: job.customerEmail,
        projectBudget: job.projectBudget,
        projectDescription: job.projectDescription,
        projectTimeline: job.projectTimeline,
        location: job.location?.fullAddress || job.location?.name || 'Location TBD',
        locationDetails: job.location,
        availableTimes: availableTimes,
        bookedTimes: job.bookedTimes || [],
        homeownerTags: job.homeownerTags || [],
        appointments: job.appointments || [],
        createdAt: job.createdAt,
        status: job.status,
        remainingSlots: availableTimes.length,
        bookedAppointments: bookedAppointmentsCount,
        maxAppointments: maxBookings,  // CHANGE THIS LINE - use dynamic value
        slotsRemaining: maxBookings - bookedAppointmentsCount  // CHANGE THIS LINE
      };
    })
      .filter(job => job !== null) // Remove jobs that hit the 3-appointment limit
      .filter(job => job.availableTimes.length > 0);

    console.log(`Final jobs with available times and under 3-appointment limit: ${formattedJobs.length}`);

    res.json({
      success: true,
      count: formattedJobs.length,
      jobs: formattedJobs,
      contractor: {
        name: req.user.name,
        tags: req.user.contractorTags || []
      }
    });

  } catch (error) {
    console.error('Error fetching available jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching available jobs',
      error: error.message
    });
  }
}