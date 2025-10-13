import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    console.log('🔍 FETCHING CONTACT TIMES');
    const { homeownerEmail } = req.body;

    if (!homeownerEmail) {
      return res.status(400).json({ error: 'Homeowner email required' });
    }

    console.log('📧 Looking for job with email:', homeownerEmail);

    // Find the job record
    const job = await AvailableJob.findOne({
      customerEmail: homeownerEmail,
      status: { $in: ['available', 'unavailable'] }
    });

    if (!job) {
      console.log('❌ No available job found for:', homeownerEmail);
      return res.status(404).json({ error: 'No available job found' });
    }

    console.log('✅ Job found:', job.customerName);

    // Calculate remaining available time slots
    const allTimes = expandTimeRanges(job.availableTimes || []); const bookedTimeStrings = (job.bookedTimes || []).map(entry =>
      typeof entry === 'string' ? entry : entry.time
    );

    const availableTimes = allTimes
      .filter(time => !bookedTimeStrings.includes(time))
      .sort((a, b) => {
        // Parse "11/4/25, 10:00 AM" format correctly
        const parseDate = (timeStr) => {
          const [datePart] = timeStr.split(',');
          const [month, day, year] = datePart.split('/');
          return new Date(`20${year}`, month - 1, day);
        };
        return parseDate(a) - parseDate(b);
      });

    console.log('✅ Returning available times:', availableTimes);

    if (availableTimes.length === 0) {
      return res.json({
        success: false,
        error: 'No available times remaining - all slots are booked'
      });
    }

    res.json({
      success: true,
      availableTimes: availableTimes,
      totalTimes: allTimes.length,
      bookedCount: bookedTimeStrings.length,
      remainingCount: availableTimes.length,
      jobId: job._id
    });

  } catch (error) {
    console.error('❌ Error fetching contact times:', error);
    res.status(500).json({
      error: 'Failed to fetch contact times',
      details: error.message
    });
  }
}
/**
 * Expand time ranges and normalize time formats
 */
function expandTimeRanges(timeArray) {
  const expandedTimes = [];

  for (let timeEntry of timeArray) {
    if (!timeEntry || typeof timeEntry !== 'string') continue;

    // Normalize the time format first (Issue 2)
    timeEntry = normalizeTimeFormat(timeEntry);

    // Check if it's a time range (Issue 1)
    if (isTimeRange(timeEntry)) {
      const expanded = expandSingleTimeRange(timeEntry);
      expandedTimes.push(...expanded);
    } else {
      expandedTimes.push(timeEntry);
    }
  }

  // Remove duplicates
  return [...new Set(expandedTimes)];
}

/**
 * Normalize time formats (4:20pm -> 4:20 PM)
 */
function normalizeTimeFormat(timeStr) {
  return timeStr
    .replace(/(\d+:\d+)\s*([ap])m\b/gi, '$1 $2M') // 4:20pm -> 4:20 PM
    .replace(/\b([AP])M\b/g, '$1M'); // Ensure AM/PM is uppercase
}

/**
 * Check if a time string contains a range
 */
function isTimeRange(timeStr) {
  // Patterns: "11:00 AM - 2:00 PM", "11:00 AM to 2:00 PM", "11:00 AM-2:00 PM"
  return /\d+:\d+\s*[AP]M\s*(-|to)\s*\d+:\d+\s*[AP]M/i.test(timeStr);
}

/**
 * Expand a single time range into hourly slots
 */
function expandSingleTimeRange(timeStr) {
  try {
    // Extract date part if present (e.g., "9/28/25, 11:00 AM - 2:00 PM")
    const parts = timeStr.split(',');
    const datePart = parts.length > 1 ? parts[0].trim() + ', ' : '';
    const timeRangePart = parts.length > 1 ? parts[1].trim() : timeStr.trim();

    // Parse the time range
    const rangeMatch = timeRangePart.match(/(\d+:\d+\s*[AP]M)\s*(-|to)\s*(\d+:\d+\s*[AP]M)/i);
    if (!rangeMatch) return [timeStr];

    const startTimeStr = rangeMatch[1].trim();
    const endTimeStr = rangeMatch[3].trim();

    // Convert to 24-hour for easier calculation
    const startTime24 = convertTo24Hour(startTimeStr);
    const endTime24 = convertTo24Hour(endTimeStr);

    const startHour = parseInt(startTime24.split(':')[0]);
    const endHour = parseInt(endTime24.split(':')[0]);

    const expandedSlots = [];

    // Generate hourly slots from start to end (inclusive)
    for (let hour = startHour; hour <= endHour; hour++) {
      const time12h = convertTo12Hour(hour);
      expandedSlots.push(datePart + time12h);
    }

    return expandedSlots;

  } catch (error) {
    console.error('Error expanding time range:', timeStr, error);
    return [timeStr]; // Return original if parsing fails
  }
}

/**
 * Convert 12-hour time to 24-hour format
 */
function convertTo24Hour(time12h) {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') hours = '00';
  if (modifier.toUpperCase() === 'PM') hours = parseInt(hours, 10) + 12;

  hours = hours.toString().padStart(2, '0');
  return `${hours}:${minutes || '00'}`;
}

/**
 * Convert 24-hour format back to 12-hour
 */
function convertTo12Hour(hour24) {
  const hour = hour24 % 12 || 12;
  const modifier = hour24 < 12 ? 'AM' : 'PM';
  return `${hour}:00 ${modifier}`;
}