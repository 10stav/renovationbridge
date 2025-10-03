//refer to google doc made at 5 pm on 10/2 for info on how to activate this file and the emailservice one
//both are dependant on Onn telling me where he bought the domain renovationbridge.com? I think, due to DNS records

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
      const checkWindowStart = new Date(oneAndHalfHoursAgo.getTime() - (7.5 * 60 * 1000)); // 7.5 min before
      const checkWindowEnd = new Date(oneAndHalfHoursAgo.getTime() + (7.5 * 60 * 1000)); // 7.5 min after
      
      // Get all jobs with booked appointments
      const jobs = await AvailableJob.find({
        'bookedTimes.0': { $exists: true }
      });

      for (const job of jobs) {
        for (const booking of job.bookedTimes) {
          // Parse the actual appointment time (not when it was booked)
          const appointmentDate = parseAppointmentTime(booking.time);
          
          if (!appointmentDate) {
            console.warn(`Could not parse appointment time: ${booking.time}`);
            continue;
          }
          
          // Check if appointment happened around 1.5 hours ago
          if (appointmentDate >= checkWindowStart && appointmentDate <= checkWindowEnd) {
            // Check if feedback already submitted
            const feedbackExists = job.feedback?.some(
              f => f.contractorId === booking.contractorId && f.appointmentTime === booking.time
            );
            
            if (!feedbackExists) {
              console.log(`Sending feedback request for appointment: ${booking.time}`);
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
      }
    } catch (error) {
      console.error('Error in feedback reminder cron:', error);
    }
  });
}

// Parse appointment time string to Date object
function parseAppointmentTime(timeString) {
  try {
    // Format: "10/17/25, 2:00 PM"
    const [datePart, timePart] = timeString.split(', ');
    if (!datePart || !timePart) return null;
    
    const [month, day, year] = datePart.split('/');
    const fullYear = year.length === 2 ? `20${year}` : year;
    
    const timeMatch = timePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return null;
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return new Date(parseInt(fullYear), parseInt(month) - 1, parseInt(day), hours, minutes);
  } catch (error) {
    console.error('Error parsing appointment time:', timeString, error);
    return null;
  }
}

async function sendFeedbackRequest(data) {
  // TODO: Integrate with email service (SendGrid, AWS SES, Resend, etc.)
  console.log(`Would send feedback request to ${data.contractorEmail} for appointment ${data.appointmentTime}`);
  
  // When implemented, email should contain:
  // - Subject: "How was your appointment with [homeowner name]?"
  // - Link: https://yoursite.com/contractorPortal (they can navigate to appointments and leave feedback)
  // - Or direct link with pre-filled data (requires token-based auth)
}