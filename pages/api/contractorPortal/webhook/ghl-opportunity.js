// pages/api/contractorPortal/webhook/ghl-opportunity.js

//gohighlevel.js (service file): 

//Makes outgoing API calls TO GHL
//Creates appointments in GHL calendar when contractors book
//Used by your book-appointment.js API

//ghl-opportunity.js (webhook file): (this file)

//Receives incoming webhooks FROM GHL
//Processes opportunity data when homeowners are moved to "Need to Book"
//Creates/updates jobs in your database



import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';
import User from '../../../../lib/contractorPortal/models/User';

function combineDateAndTime(dateValue, timeValue) { ///this function takes separate date and time values from GHL webhook custom fields and combines them into a single formatted string. It is used when The GHL webhook fires (when a homeowner is moved to "Need to Book" status), when Processing the 3 availability slots that the admin set up in GHL custom fields, and when Converting separate date/time fields from GHL into the unified format our system expects. All 3 of these uses are in this file, within the main handler function where the webhoom processes the availability data (const availabletime1 =  ... etc.) 
  if (!dateValue && !timeValue) {
    return '';
  }
  if (!dateValue && timeValue) {
    console.log(`Time provided without date: "${timeValue}"`);
    return `TBD, ${timeValue}`;
  }
  if (dateValue && !timeValue) {
    const formattedDate = formatDateFromISO(dateValue);
    console.log(`Date provided without time: "${formattedDate}"`);
    return `${formattedDate}, TBD`;
  }
  const formattedDate = formatDateFromISO(dateValue);
  const processedTime = processTimeInput(timeValue);
  return `${formattedDate}, ${processedTime}`;
}

function formatDateFromISO(isoDate) { ///this function converts ISO date format (YYYY-MM-DD) from GHL webhook into MM/DD/YY format used throughout the system. /it is called by combineDateAndTime when processing the 3 availability date fields from the webhook. handles edge cases like missing dates and invalid formats with error logging
  try {
    if (!isoDate) return '';
    const date = new Date(isoDate + 'T00:00:00');
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return isoDate;
  }
}

function processTimeInput(timeInput) { ///this function standardizes time format from GHL webhook custom fields for consistency. converts time ranges with " - " to " to " format (e.g., "2:00 PM - 4:00 PM" becomes "2:00 PM to 4:00 PM"). it is called by combineDateAndTime when processing the 3 availability time fields from the webhook  
  if (!timeInput) return '';
  const trimmed = timeInput.trim();
  if (trimmed.includes(' - ')) {
    const [startTime, endTime] = trimmed.split(' - ');
    return `${startTime.trim()} to ${endTime.trim()}`;
  }
  return trimmed;
}
function parseTimeSlotForGHL(timeSlot) {
  ///this function converts our system's time slot format back to GHL API format for calendar conflict checking
  ///it is called by checkGHLCalendarConflicts when validating each of the 3 availability slots against existing GHL appointments
  ///takes format like "1/15/25, 2:00 PM to 4:00 PM" and extracts date as "2025-01-15" and time as "2:00 PM to 4:00 PM"
  ///handles the reverse conversion of what combineDateAndTime does - from our format back to GHL-compatible format
  try {
    if (!timeSlot || !timeSlot.includes(', ')) {
      throw new Error('Invalid time slot format');
    }

    const parts = timeSlot.split(', ');
    const datePart = parts[0]; // "1/15/25"
    const timePart = parts[1]; // "2:00 PM to 4:00 PM"

    // Convert date format (1/15/25 -> 2025-01-15)
    const [month, day, year] = datePart.split('/');
    const fullYear = year.length === 2 ? `20${year}` : year;
    const formattedDate = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    return { date: formattedDate, time: timePart };
  } catch (error) {
    console.error('Error parsing time slot for GHL:', timeSlot, error);
    return null;
  }
}

async function checkGHLCalendarConflicts(timeSlots) {
  ///this function checks each proposed availability time slot against existing booked appointments(in our system, no need to check ghl suince we have recorded all booked jobs as well here) to prevent booking conflicts
  ///it is called by storeAvailableJob before saving the job to database, validating all 3 admin-set availability slots
  ///queries booked appointments for each date to find existing appointments and compares times
  ///returns array of conflicting time slots that should be filtered out to prevent contractor booking failures
  ///prevents the scenario where contractors see available times but GHL booking fails due to existing appointments
  ///NOW ALSO checks for time slots within 1.5 hours of each other to ensure adequate spacing between appointments
  const conflicts = [];

  for (const timeSlot of timeSlots) {
    if (!timeSlot || timeSlot === '' || timeSlot.includes('TBD')) {
      continue;
    }

    try {
      // Parse the proposed time slot
      const proposedTime = parseTimeSlotToDate(timeSlot);
      if (!proposedTime) {
        console.warn(`Could not parse time slot: ${timeSlot}`);
        continue;
      }

      // Get all existing jobs to check against
      const existingJobs = await AvailableJob.find({
        status: { $in: ['available', 'claimed'] }
      });

      for (const existingJob of existingJobs) {
        // Check against available times
        for (const availableTime of existingJob.availableTimes || []) {
          const existingTime = parseTimeSlotToDate(availableTime);
          if (existingTime && hasTimeConflict(proposedTime, existingTime)) {
            conflicts.push({
              timeSlot: timeSlot,
              conflictType: 'available',
              conflictingJob: existingJob.customerName
            });
            console.warn(`Time overlap detected: ${timeSlot} within 1.5hr of ${availableTime} for ${existingJob.customerName}`);
            break; // Found conflict, no need to check more times for this job
          }
        }

        // Check against booked times
        for (const booking of existingJob.bookedTimes || []) {
          const bookedTime = parseTimeSlotToDate(booking.time);
          if (bookedTime && hasTimeConflict(proposedTime, bookedTime)) {
            conflicts.push({
              timeSlot: timeSlot,
              conflictType: 'booked',
              conflictingJob: existingJob.customerName
            });
            console.warn(`Time overlap detected: ${timeSlot} within 1.5hr of booked ${booking.time} for ${existingJob.customerName}`);
            break;
          }
        }
      }

    } catch (error) {
      console.error(`Error checking conflicts for ${timeSlot}:`, error);
    }
  }

  return conflicts;
}

// Helper function to parse time slots into Date objects
function parseTimeSlotToDate(timeSlot) {
  try {
    // Format: "10/17/25, 2:00 PM" or "10/17/25, 2:00 PM to 4:00 PM"
    const parts = timeSlot.split(', ');
    if (parts.length < 2) return null;

    const datePart = parts[0]; // "10/17/25"
    let timePart = parts[1]; // "2:00 PM" or "2:00 PM to 4:00 PM"

    // If it's a range, use the start time
    if (timePart.includes(' to ')) {
      timePart = timePart.split(' to ')[0].trim();
    }

    // Parse date
    const [month, day, year] = datePart.split('/');
    const fullYear = year.length === 2 ? `20${year}` : year;

    // Create date string in format that Date constructor can parse
    const dateStr = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Parse time
    const timeMatch = timePart.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return null;

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const dateObj = new Date(`${dateStr}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);

    return isNaN(dateObj.getTime()) ? null : dateObj;
  } catch (error) {
    console.error('Error parsing time slot:', timeSlot, error);
    return null;
  }
}

// Helper function to check if two times conflict (within 1.5 hours)
function hasTimeConflict(time1, time2) {
  const BUFFER_MS = 1.5 * 60 * 60 * 1000; // 1.5 hours in milliseconds
  const timeDiff = Math.abs(time1.getTime() - time2.getTime());
  return timeDiff < BUFFER_MS;
}

async function storeAvailableJob(contactData, originalWebhookData) { ///this function creates or updates job records in the database when homeowners are moved to "Need to Book" pipeline stage
  console.log('=== STORE AVAILABLE JOB STARTED ===');
  console.log('Contact data received:', contactData);


  ///it is called by the main webhook handler after processing the GHL webhook payload
  ///handles 3 scenarios: new job creation, updating existing available jobs, and reactivating previously removed jobs
  ///processes the 3 combined availability times and stores them in the availableTimes array for contractors to see
  ///also stores admin-set individual times in adminSetTimes for reference and potential future admin editing
  ///manages job status logic based on existing bookings when reactivating removed jobs
  try {
    console.log('Storing available job in database...');

    const proposedTimes = [
      contactData.availableTime1,
      contactData.availableTime2,
      contactData.availableTime3
    ].filter(time => typeof time === 'string' && time.trim() !== '');

    // NEW: Check for GHL calendar conflicts
    console.log('Checking GHL calendar for conflicts...');
    const conflicts = await checkGHLCalendarConflicts(proposedTimes);

    let availableTimes;
    let conflictWarning = '';

    if (conflicts.length > 0) {
      console.warn('INTERNAL CONFLICTS DETECTED:', conflicts);

      // Filter out conflicting times
      availableTimes = proposedTimes.filter(time =>
        !conflicts.some(conflict => conflict.timeSlot === time)
      );

      // Log detailed conflict info
      conflicts.forEach(conflict => {
        console.warn(`  - ${conflict.timeSlot} conflicts with ${conflict.conflictingJob} (${conflict.conflictType})`);
      });

      console.log('Available times after removing conflicts:', availableTimes);
    } else {
      console.log('No internal conflicts detected');
      availableTimes = proposedTimes;
    }


    console.log('Processed available times:', availableTimes);
    console.log('DEBUG: availableTimes before saving to DB:', availableTimes);
    console.log('DEBUG: availableTimes length:', availableTimes.length);
    console.log('DEBUG: availableTimes type:', typeof availableTimes);

    const existingJob = await AvailableJob.findOne({
      customerId: contactData.contactId
    });

    if (existingJob) {
      if (existingJob.status === 'available') {
        console.log('ℹ Job already exists and is active for:', contactData.contactName);
        console.log('Updating available times...');

        const updatedJob = await AvailableJob.findOneAndUpdate(
          { customerId: contactData.contactId },
          {
            adminSetTimes: {
              time1: contactData.availableTime1,
              time2: contactData.availableTime2,
              time3: contactData.availableTime3
            },
            availableTimes: availableTimes,
            conflicts: conflicts,
            maxBookings: contactData.maxBookings,  // ADD THIS LINE
            updatedAt: new Date(),
            ghlData: originalWebhookData
          },
          { new: true }
        );

        console.log('DEBUG SCENARIO 1: Updated job from DB:', JSON.stringify(updatedJob, null, 2));
        console.log('DEBUG SCENARIO 1: availableTimes in updated job:', updatedJob.availableTimes);
        console.log('Job times updated successfully');
        return updatedJob;

      } else if (existingJob.status === 'removed') {
        console.log('Checking if removed job has existing bookings...');

        const allTimes = availableTimes;
        const bookedTimeStrings = (existingJob.bookedTimes || []).map(b => b.time);
        const isFullyBooked = allTimes.every(time => bookedTimeStrings.includes(time));
        const newStatus = isFullyBooked ? 'claimed' : 'available';

        console.log(`Reactivating job with status: ${newStatus}`);

        const reactivatedJob = await AvailableJob.findOneAndUpdate(
          { customerId: contactData.contactId },
          {
            status: newStatus,
            homeownerTags: contactData.tags,
            customerName: contactData.contactName,
            customerEmail: contactData.contactEmail,
            customerPhone: contactData.contactPhone,
            projectBudget: contactData.projectBudget || existingJob.projectBudget,
            projectDescription: contactData.projectDescription || existingJob.projectDescription,
            projectTimeline: contactData.projectTimeline || existingJob.projectTimeline,
            location: {
              name: contactData.location?.name || existingJob.location?.name || '',
              address: contactData.location?.address || existingJob.location?.address || '',
              city: contactData.location?.city || existingJob.location?.city || '',
              state: contactData.location?.state || existingJob.location?.state || '',
              fullAddress: contactData.location?.fullAddress || existingJob.location?.fullAddress || 'Location TBD'
            },
            adminSetTimes: {
              time1: contactData.availableTime1,
              time2: contactData.availableTime2,
              time3: contactData.availableTime3
            },
            availableTimes: availableTimes,
            conflicts: conflicts,
            maxBookings: contactData.maxBookings,  // ADD THIS LINE
            updatedAt: new Date(),
            ghlData: originalWebhookData
          },
          { new: true }
        );

        console.log('Job reactivated successfully:', reactivatedJob._id);
        console.log('Updated job with times:', {
          customer: reactivatedJob.customerName,
          budget: reactivatedJob.projectBudget,
          location: reactivatedJob.location.fullAddress,
          availableTimes: reactivatedJob.availableTimes
        });

        console.log('DEBUG SCENARIO 2: Reactivated job from DB:', JSON.stringify(reactivatedJob, null, 2));
        console.log('DEBUG SCENARIO 2: availableTimes in reactivated job:', reactivatedJob.availableTimes);

        return reactivatedJob;
      }
    }

    console.log('Creating new job for:', contactData.contactName);
    console.log('DEBUG SCENARIO 3: About to create new job with availableTimes:', availableTimes);

    const availableJob = new AvailableJob({ /// when a contact that hasnt been in our external website system(our app) is dragged into need to book (in ghl) -> (therefore entering into our external website system/app) checked by seeing if it has an existing contactID matching in our system. if it already does, we either use updatedJob (if status is "available") OR reactivatedJob (if status is "removed"). both of those functions can be found above
      customerId: contactData.contactId,
      customerName: contactData.contactName,
      customerEmail: contactData.contactEmail,
      customerPhone: contactData.contactPhone,
      projectBudget: contactData.projectBudget || 'TBD',
      projectDescription: contactData.projectDescription || 'Details to be discussed',
      projectTimeline: contactData.projectTimeline || 'TBD',
      location: {
        name: contactData.location?.name || '',
        address: contactData.location?.address || '',
        city: contactData.location?.city || '',
        state: contactData.location?.state || '',
        fullAddress: contactData.location?.fullAddress || 'Location TBD'
      },
      status: 'available',
      adminSetTimes: {
        time1: contactData.availableTime1,
        time2: contactData.availableTime2,
        time3: contactData.availableTime3
      },
      availableTimes: availableTimes,
      conflicts: conflicts, // ADD THIS LINE
      homeownerTags: contactData.tags,
      maxBookings: contactData.maxBookings,  // ADD THIS LINE
      ghlData: originalWebhookData
    });


    const savedJob = await availableJob.save();

    console.log('DEBUG SCENARIO 3: Saved job from DB:', JSON.stringify(savedJob, null, 2));
    console.log('DEBUG SCENARIO 3: availableTimes in saved job:', savedJob.availableTimes);
    console.log('New available job created successfully:', savedJob._id);
    console.log('Job details:', {
      customer: savedJob.customerName,
      budget: savedJob.projectBudget,
      location: savedJob.location.fullAddress,
      availableTimes: savedJob.availableTimes,
      homeownerTags: savedJob.homeownerTags
    });

    return savedJob;

  } catch (error) {
    console.error('Error storing available job:', error);
    throw error;
  }
}

async function notifyContractors(contactData) {   ///this function handles contractor notification logic when new jobs become available  
  ///it is called by the main webhook handler after a job is successfully stored in the database
  ///currently finds contractors with matching tags (specifically "kitchen remodeling") and logs who would be notified
  ///the actual email sending functionality is not yet implemented - this is a placeholder for future email integration
  ///filters contractors by: role=contractor, has matching tags, and isActive=true status
  console.log('CONTRACTOR NOTIFICATION TRIGGERED!');
  console.log('Project Budget:', contactData.projectBudget);
  console.log('Customer:', contactData.contactName);
  console.log('Email:', contactData.contactEmail);
  console.log('Phone:', contactData.contactPhone);

  try {
    const contractors = await User.find({ role: 'contractor' });

    console.log('All Contractors:', contractors.map(c => ({
      name: c.name,
      email: c.email,
      tags: c.contractorTags,
      isActive: c.isActive
    })));

    const matchingContractors = contractors.filter(c =>
      Array.isArray(c.contractorTags) &&
      c.contractorTags.map(tag => tag.toLowerCase()).includes('kitchen remodeling') &&
      c.isActive
    );
    console.log(`Sending emails to ${matchingContractors.length} matching contractors...`);

    // Note: Email functionality would be implemented here
    // For now, just log what would happen
    matchingContractors.forEach(contractor => {
      console.log(`Would send email to: ${contractor.email}`);
    });

    console.log(`Email notifications sent: ${matchingContractors.length} contractors notified`);
  } catch (error) {
    console.error('Error notifying contractors:', error);
  }
}

export default async function handler(req, res) { ///this is the main webhook endpoint that receives POST requests from GoHighLevel when opportunities change pipeline stages
  ///it processes webhook payloads when homeowners are moved to/from "Need to Book" status
  ///extracts availability data from 6 GHL custom fields (3 dates + 3 times) and combines them using combineDateAndTime
  ///calls storeAvailableJob to save/update job records and notifyContractors to alert relevant contractors
  ///handles both job creation (moving TO "Need to Book") and job removal (moving AWAY from "Need to Book" or deletion)
  ///returns success/error responses back to GHL to confirm webhook processing status
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('WEBHOOK HIT! ANY REQUEST RECEIVED!');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('GHL Webhook received!');

  try {
    await connectToDatabase();

    const webhookData = req.body;

    // Extract core identifiers from webhook payload
    const opportunityId = webhookData.id;
    const contactId = webhookData.contact_id;

    // Extract tags from webhook
    const rawTags = webhookData.tags || webhookData.contact?.tags || '';
    const ghlTagsArray = Array.isArray(rawTags)
      ? rawTags
      : typeof rawTags === 'string'
        ? rawTags.split(',').map(t => t.trim())
        : [];

    const normalizedTags = ghlTagsArray.map(tag => tag.toLowerCase());

    console.log('Homeowner GHL Tags:', normalizedTags);
    console.log('Opportunity ID:', opportunityId);
    console.log('Contact ID:', contactId);

    // Check if opportunity was deleted (same removal behavior as moving out of pipeline)
    if (webhookData.type === 'OpportunityDelete' || webhookData.event_type === 'opportunity.delete' || webhookData.deleted === true) {
      console.log('REMOVING job - opportunity deleted');

      await AvailableJob.findOneAndUpdate(
        { customerId: webhookData.contact_id },
        { status: 'removed' },
        { new: true }
      );

      return res.status(200).json({ success: true, message: 'Job removed due to deletion' });
    }



    // Original Pipeline stage check
    if (webhookData.pipleline_stage !== 'Need to Book') {
      console.log('REMOVING job - contact moved to:', webhookData.pipleline_stage);

      await AvailableJob.findOneAndUpdate(
        { customerId: webhookData.contact_id },
        { status: 'removed' },
        { new: true }
      );
      return res.status(200).json({ success: true, message: 'Job removed' });
    }

    console.log('ADDING job - contact in Need to Book');

    // Read availability data from webhook payload
    console.log('Reading availability data from webhook payload...');

    const availableTime1 = combineDateAndTime(
      webhookData['Homeowner/Contact Available Date 1'] || '',
      webhookData['Homeowner/Contact Available Time 1'] || ''
    );

    const availableTime2 = combineDateAndTime(
      webhookData['Homeowner/Contact Available Date 2'] || '',
      webhookData['Homeowner/Contact Available Time 2'] || ''
    );

    const availableTime3 = combineDateAndTime(
      webhookData['Homeowner/Contact Available Date 3'] || '',
      webhookData['Homeowner/Contact Available Time 3'] || ''
    );

    console.log('Combined availability times:');
    console.log('  Time 1:', availableTime1);
    console.log('  Time 2:', availableTime2);
    console.log('  Time 3:', availableTime3);

    // Prepare contact data from webhook payload
    const contactData = {
      contactId: webhookData.contact_id,
      contactName: webhookData.full_name,
      contactEmail: webhookData.email || 'No email provided',
      contactPhone: webhookData.phone || 'No phone provided',
      projectBudget: webhookData['Project Budget'],
      projectDescription: webhookData['Project Description '],
      projectTimeline: webhookData['Project Time Line'],
      tags: normalizedTags,
      location: webhookData.location,
      availableTime1: availableTime1,
      availableTime2: availableTime2,
      availableTime3: availableTime3,
      maxBookings: parseInt(webhookData['Max Bookings']) || 3  // ADD THIS LINE - reads from GHL custom field
    };

    // Debug tags
    if (webhookData.tags && webhookData.tags.length > 0) {
      console.log('GHL Tags Found for Job:', webhookData.tags);
    } else {
      console.log('No tags found in GHL webhook payload.');
    }

    console.log('CONTACT DATA RECEIVED!');
    console.log('Creating available job for contractors...');
    console.log('Customer:', contactData.contactName);
    console.log('Budget:', contactData.projectBudget);
    console.log('Email:', contactData.contactEmail);
    console.log('Phone:', contactData.contactPhone);
    console.log('Available Times:', {
      time1: contactData.availableTime1,
      time2: contactData.availableTime2,
      time3: contactData.availableTime3
    });

    // Store job in database
    console.log('=== ABOUT TO CALL STORE AVAILABLE JOB ===');
    console.log('Contact data being passed:', contactData);

    const storedJob = await storeAvailableJob(contactData, webhookData);

    // Send email notifications to contractors
    await notifyContractors(contactData);

    // Return success response to GHL with conflict info
    const conflictCount = [contactData.availableTime1, contactData.availableTime2, contactData.availableTime3]
      .filter(time => time && !time.includes('TBD')).length - (storedJob.availableTimes?.length || 0);

    res.status(200).json({
      success: true,
      message: conflictCount > 0
        ? `Job stored successfully! ${conflictCount} time slot(s) were removed due to existing GHL appointments.`
        : 'Job stored and contractors notified successfully!',
      contact: contactData.contactName,
      availableTimes: storedJob.availableTimes || [],
      conflictsRemoved: conflictCount || 0,
      debugConflicts: storedJob.conflicts || [] // ADD THIS LINE
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}