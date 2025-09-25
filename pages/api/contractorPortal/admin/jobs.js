/// This file: Allows authenticated admins to retrieve a comprehensive list of available jobs in the contractor portal system for management and oversight purposes
/// is also a Next.js API route handler 

///not to be confused with contractors.js which exists in the same location as this file but is slightly different:
///contractors.js: "Who are my contractors and what's their status?"
///jobs.js: "What jobs are in the system and who's working on them?"



import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';
import User from '../../../../lib/contractorPortal/models/User';
import jwt from 'jsonwebtoken';

const authenticateAdmin = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);

  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectToDatabase();

  try {
    const admin = await authenticateAdmin(req);

    console.log('Admin fetching available jobs...');

    const jobs = await AvailableJob.find({
      status: { $in: ['available', 'claimed'] }
    }).sort({ createdAt: -1 });

    console.log(`Found ${jobs.length} jobs`);

    res.json({
      success: true,
      jobs: jobs.map(job => {
        // Expand time ranges for consistent display with contractor side
        const expandedAvailableTimes = expandTimeRanges(job.availableTimes || []);

        return {
          _id: job._id,
          customerName: job.customerName,
          customerEmail: job.customerEmail,
          customerPhone: job.customerPhone,
          projectBudget: job.projectBudget,
          projectDescription: job.projectDescription,
          location: job.location,
          status: job.status,
          availableTimes: expandedAvailableTimes, // Now shows individual time slots
          adminSetTimes: job.adminSetTimes,
          bookedTimes: job.bookedTimes || [],
          appointments: job.appointments || [],
          homeownerTags: job.homeownerTags || [],
          claimedBy: job.claimedBy,
          createdAt: job.createdAt
        };
      })
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    if (error.message.includes('token') || error.message.includes('Admin')) {
      return res.status(401).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
}
// Add these functions at the bottom of jobs.js (copied from book-appointment.js)
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