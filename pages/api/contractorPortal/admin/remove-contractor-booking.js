import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectToDatabase();

    const { jobId, contractorId, timeSlot } = req.body;

    if (!jobId || !contractorId || !timeSlot) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('🗑️ Removing booking:', { jobId, contractorId, timeSlot });

    // Find and update the job
    const job = await AvailableJob.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Remove the booking from bookedTimes array
    job.bookedTimes = job.bookedTimes.filter(booking => 
      !(booking.contractorId?.toString() === contractorId && booking.time === timeSlot)
    );

    // Remove from appointments array as well
    job.appointments = job.appointments.filter(appointment => 
      !(appointment.contractorId?.toString() === contractorId && appointment.timeSlot === timeSlot)
    );

    // Add the time back to availableTimes if not already there
    if (!job.availableTimes.includes(timeSlot)) {
      job.availableTimes.push(timeSlot);
    }

    // Update job status if needed
    if (job.status === 'claimed' && job.bookedTimes.length === 0) {
      job.status = 'available';
      job.claimedBy = null;
      job.claimedAt = null;
    }

    await job.save();

    console.log('✅ Booking removed successfully');

    res.json({
      success: true,
      message: 'Contractor booking removed successfully',
      job: {
        id: job._id,
        remainingBookings: job.bookedTimes.length,
        status: job.status
      }
    });

  } catch (error) {
    console.error('❌ Error removing contractor booking:', error);
    res.status(500).json({
      error: 'Failed to remove contractor booking',
      details: error.message
    });
  }
}