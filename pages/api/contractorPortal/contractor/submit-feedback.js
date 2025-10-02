import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';
import { authenticateContractor } from '../../../../lib/contractorPortal/utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const contractor = await authenticateContractor(req);
    await connectToDatabase();

    const { jobId, appointmentTime, rating, comment } = req.body;

    // Validation
    if (!jobId || !appointmentTime || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Find the job and verify the contractor booked this appointment
    const job = await AvailableJob.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const booking = job.bookedTimes.find(
      b => b.contractorId === contractor.id && b.time === appointmentTime
    );

    if (!booking) {
      return res.status(403).json({ error: 'You did not book this appointment' });
    }

    // Check if feedback already exists
    const existingFeedback = job.feedback?.find(
      f => f.contractorId === contractor.id && f.appointmentTime === appointmentTime
    );

    if (existingFeedback) {
      return res.status(400).json({ error: 'Feedback already submitted for this appointment' });
    }

    // Add feedback
    await AvailableJob.findByIdAndUpdate(
      jobId,
      {
        $push: {
          feedback: {
            contractorId: contractor.id,
            contractorName: contractor.name,
            appointmentTime: appointmentTime,
            rating: rating,
            comment: comment || '',
            submittedAt: new Date()
          }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
}