import cron from 'node-cron';
import { connectToDatabase } from '../utils/mongodb';
import AvailableJob from '../models/Availablejob';

// Run every 15 minutes to check for appointments that ended 1.5 hours ago
export function startFeedbackReminderCron() {
  cron.schedule('*/15 * * * *', async () => {
    console.log('Checking for appointments needing feedback requests...');
    
    try {
      await connectToDatabase();
      
      const now = new Date();
      const oneAndHalfHoursAgo = new Date(now.getTime() - (1.5 * 60 * 60 * 1000));
      
      // Find jobs with bookings from around 1.5 hours ago
      const jobs = await AvailableJob.find({
        'bookedTimes.bookedAt': {
          $gte: new Date(oneAndHalfHoursAgo.getTime() - (15 * 60 * 1000)),
          $lte: new Date(oneAndHalfHoursAgo.getTime() + (15 * 60 * 1000))
        }
      });

      for (const job of jobs) {
        for (const booking of job.bookedTimes) {
          // Check if feedback already submitted
          const feedbackExists = job.feedback?.some(
            f => f.contractorId === booking.contractorId && f.appointmentTime === booking.time
          );
          
          if (!feedbackExists) {
            // Send email/SMS to contractor
            await sendFeedbackRequest({
              contractorEmail: booking.contractorEmail,
              contractorName: booking.contractorName,
              homeownerName: job.customerName,
              appointmentTime: booking.time,
              jobId: job._id,
              contractorId: booking.contractorId
            });
          }
        }
      }
    } catch (error) {
      console.error('Error in feedback reminder cron:', error);
    }
  });
}

async function sendFeedbackRequest(data) {
  // TODO: Implement with your email service (SendGrid, AWS SES, Resend, etc.)
  console.log(`Sending feedback request to ${data.contractorEmail}`);
  
  // Example: Email should contain a link like:
  // https://yoursite.com/contractor/submit-feedback?jobId=${data.jobId}&time=${data.appointmentTime}
  
  // For now, just log - you'll need to integrate with an email service
}