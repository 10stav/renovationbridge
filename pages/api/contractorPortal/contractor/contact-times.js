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
    const allTimes = job.availableTimes || [];
    const bookedTimeStrings = (job.bookedTimes || []).map(entry =>
      typeof entry === 'string' ? entry : entry.time
    );

    const availableTimes = allTimes
      .filter(time => !bookedTimeStrings.includes(time))
      .sort((a, b) => {
        const dateA = new Date(a.split(',')[0] || a.split(' at ')[0]);
        const dateB = new Date(b.split(',')[0] || b.split(' at ')[0]);
        return dateA - dateB;
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