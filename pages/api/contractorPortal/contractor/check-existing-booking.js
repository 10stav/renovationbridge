///this file: Prevents double-booking by checking if a contractor has already booked an 
/// appointment with a specific homeowner before allowing new bookings.

///aka booking conflict checker endpoint.
///this file is also also a next.js api route handler
import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { homeownerEmail, contractorId } = req.body;

    if (!homeownerEmail || !contractorId) {
      return res.status(400).json({ error: 'Homeowner email and contractor ID required' });
    }

    console.log('Checking existing booking for contractor:', contractorId, 'with homeowner:', homeownerEmail);

    // Find job for this homeowner
    const job = await AvailableJob.findOne({
      customerEmail: homeownerEmail,
      status: { $in: ['available', 'unavailable'] }
    });

    if (!job) {
      return res.json({ hasExistingBooking: false });
    }

    // Check if this contractor has already booked any time slot with this homeowner
    const hasExistingBooking = job.bookedTimes?.some(booking => 
      booking.contractorId?.toString() === contractorId.toString()
    );

    console.log('Existing booking found:', hasExistingBooking);

    res.json({
      success: true,
      hasExistingBooking: hasExistingBooking,
      jobId: job._id
    });

  } catch (error) {
    console.error('Error checking existing booking:', error);
    res.status(500).json({
      error: 'Failed to check existing booking',
      details: error.message
    });
  }
}