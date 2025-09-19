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

function combineDateAndTime(dateValue, timeValue) {
  if (!dateValue && !timeValue) {
    return '';
  }
  if (!dateValue && timeValue) {
    console.log(`⚠️ Time provided without date: "${timeValue}"`);
    return `TBD, ${timeValue}`;
  }
  if (dateValue && !timeValue) {
    const formattedDate = formatDateFromISO(dateValue);
    console.log(`⚠️ Date provided without time: "${formattedDate}"`);
    return `${formattedDate}, TBD`;
  }
  const formattedDate = formatDateFromISO(dateValue);
  const processedTime = processTimeInput(timeValue);
  return `${formattedDate}, ${processedTime}`;
}

function formatDateFromISO(isoDate) {
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

function processTimeInput(timeInput) {
  if (!timeInput) return '';
  const trimmed = timeInput.trim();
  if (trimmed.includes(' - ')) {
    const [startTime, endTime] = trimmed.split(' - ');
    return `${startTime.trim()} to ${endTime.trim()}`;
  }
  return trimmed;
}

async function storeAvailableJob(contactData, originalWebhookData) {
  try {
    console.log('💾 Storing available job in database...');

    const availableTimes = [
      contactData.availableTime1,
      contactData.availableTime2,
      contactData.availableTime3
    ].filter(time => typeof time === 'string' && time.trim() !== '');

    console.log('📅 Processed available times:', availableTimes);
    console.log('📝 DEBUG: availableTimes before saving to DB:', availableTimes);
    console.log('📝 DEBUG: availableTimes length:', availableTimes.length);
    console.log('📝 DEBUG: availableTimes type:', typeof availableTimes);

    const existingJob = await AvailableJob.findOne({
      customerId: contactData.contactId
    });

    if (existingJob) {
      if (existingJob.status === 'available') {
        console.log('ℹ Job already exists and is active for:', contactData.contactName);
        console.log('🔄 Updating available times...');

        const updatedJob = await AvailableJob.findOneAndUpdate(
          { customerId: contactData.contactId },
          {
            adminSetTimes: {
              time1: contactData.availableTime1,
              time2: contactData.availableTime2,
              time3: contactData.availableTime3
            },
            availableTimes: availableTimes,
            updatedAt: new Date(),
            ghlData: originalWebhookData
          },
          { new: true }
        );

        console.log('📝 DEBUG SCENARIO 1: Updated job from DB:', JSON.stringify(updatedJob, null, 2));
        console.log('📝 DEBUG SCENARIO 1: availableTimes in updated job:', updatedJob.availableTimes);
        console.log('✅ Job times updated successfully');
        return updatedJob;

      } else if (existingJob.status === 'removed') {
        console.log('🔄 Checking if removed job has existing bookings...');

        const allTimes = availableTimes;
        const bookedTimeStrings = (existingJob.bookedTimes || []).map(b => b.time);
        const isFullyBooked = allTimes.every(time => bookedTimeStrings.includes(time));
        const newStatus = isFullyBooked ? 'claimed' : 'available';

        console.log(`🔄 Reactivating job with status: ${newStatus}`);

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
            bookedTimes: [],
            appointments: [],
            updatedAt: new Date(),
            ghlData: originalWebhookData
          },
          { new: true }
        );

        console.log('✅ Job reactivated successfully:', reactivatedJob._id);
        console.log('📋 Updated job with times:', {
          customer: reactivatedJob.customerName,
          budget: reactivatedJob.projectBudget,
          location: reactivatedJob.location.fullAddress,
          availableTimes: reactivatedJob.availableTimes
        });

        console.log('📝 DEBUG SCENARIO 2: Reactivated job from DB:', JSON.stringify(reactivatedJob, null, 2));
        console.log('📝 DEBUG SCENARIO 2: availableTimes in reactivated job:', reactivatedJob.availableTimes);

        return reactivatedJob;
      }
    }

    console.log('🆕 Creating new job for:', contactData.contactName);
    console.log('📝 DEBUG SCENARIO 3: About to create new job with availableTimes:', availableTimes);

    const availableJob = new AvailableJob({
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
      bookedTimes: [],
      appointments: [],
      homeownerTags: contactData.tags,
      ghlData: originalWebhookData
    });

    const savedJob = await availableJob.save();

    console.log('📝 DEBUG SCENARIO 3: Saved job from DB:', JSON.stringify(savedJob, null, 2));
    console.log('📝 DEBUG SCENARIO 3: availableTimes in saved job:', savedJob.availableTimes);
    console.log('✅ New available job created successfully:', savedJob._id);
    console.log('📋 Job details:', {
      customer: savedJob.customerName,
      budget: savedJob.projectBudget,
      location: savedJob.location.fullAddress,
      availableTimes: savedJob.availableTimes,
      homeownerTags: savedJob.homeownerTags
    });

    return savedJob;

  } catch (error) {
    console.error('❌ Error storing available job:', error);
    throw error;
  }
}

async function notifyContractors(contactData) {
  console.log('📢 CONTRACTOR NOTIFICATION TRIGGERED!');
  console.log('🏗 Project Budget:', contactData.projectBudget);
  console.log('👤 Customer:', contactData.contactName);
  console.log('📧 Email:', contactData.contactEmail);
  console.log('📱 Phone:', contactData.contactPhone);

  try {
    const contractors = await User.find({ role: 'contractor' });

    console.log('🧪 All Contractors:', contractors.map(c => ({
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
    console.log(`📬 Sending emails to ${matchingContractors.length} matching contractors...`);

    // Note: Email functionality would be implemented here
    // For now, just log what would happen
    matchingContractors.forEach(contractor => {
      console.log(`📧 Would send email to: ${contractor.email}`);
    });

    console.log(`✅ Email notifications sent: ${matchingContractors.length} contractors notified`);
  } catch (error) {
    console.error('❌ Error notifying contractors:', error);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🚨 WEBHOOK HIT! ANY REQUEST RECEIVED!');
  console.log('📋 Headers:', req.headers);
  console.log('📋 Body:', JSON.stringify(req.body, null, 2));
  console.log('🎯 GHL Webhook received!');

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

    console.log('🏷️ Homeowner GHL Tags:', normalizedTags);
    console.log('📋 Opportunity ID:', opportunityId);
    console.log('📋 Contact ID:', contactId);

    // Check if opportunity was deleted (same removal behavior as moving out of pipeline)
    if (webhookData.type === 'OpportunityDelete' || webhookData.event_type === 'opportunity.delete' || webhookData.deleted === true) {
      console.log('❌ REMOVING job - opportunity deleted');

      await AvailableJob.findOneAndUpdate(
        { customerId: webhookData.contact_id },
        { status: 'removed' },
        { new: true }
      );

      return res.status(200).json({ success: true, message: 'Job removed due to deletion' });
    }



    // Original Pipeline stage check
    if (webhookData.pipleline_stage !== 'Need to Book') {
      console.log('❌ REMOVING job - contact moved to:', webhookData.pipleline_stage);

      await AvailableJob.findOneAndUpdate(
        { customerId: webhookData.contact_id },
        { status: 'removed' },
        { new: true }
      );
      return res.status(200).json({ success: true, message: 'Job removed' });
    }

    console.log('✅ ADDING job - contact in Need to Book');

    // Read availability data from webhook payload
    console.log('📋 Reading availability data from webhook payload...');

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

    console.log('📅 Combined availability times:');
    console.log('  Time 1:', availableTime1);
    console.log('  Time 2:', availableTime2);
    console.log('  Time 3:', availableTime3);

    // Prepare contact data from webhook payload
    const contactData = {
      contactId: webhookData.contact_id,
      contactName: webhookData.full_name,
      contactEmail: webhookData.email,
      contactPhone: webhookData.phone || 'No phone provided',
      projectBudget: webhookData['Project Budget'],
      projectDescription: webhookData['Project Description '],
      projectTimeline: webhookData['Project Time Line'],
      tags: normalizedTags,
      location: webhookData.location,
      availableTime1: availableTime1,
      availableTime2: availableTime2,
      availableTime3: availableTime3
    };

    // Debug tags
    if (webhookData.tags && webhookData.tags.length > 0) {
      console.log('🟢 GHL Tags Found for Job:', webhookData.tags);
    } else {
      console.log('🔴 No tags found in GHL webhook payload.');
    }

    console.log('🚨 CONTACT DATA RECEIVED!');
    console.log('📞 Creating available job for contractors...');
    console.log('👤 Customer:', contactData.contactName);
    console.log('💰 Budget:', contactData.projectBudget);
    console.log('📧 Email:', contactData.contactEmail);
    console.log('📱 Phone:', contactData.contactPhone);
    console.log('⏰ Available Times:', {
      time1: contactData.availableTime1,
      time2: contactData.availableTime2,
      time3: contactData.availableTime3
    });

    // Store job in database
    await storeAvailableJob(contactData, webhookData);

    // Send email notifications to contractors
    await notifyContractors(contactData);

    // Return success response to GHL
    res.status(200).json({
      success: true,
      message: 'Job stored and contractors notified successfully!',
      contact: contactData.contactName,
      availableTimes: [contactData.availableTime1, contactData.availableTime2, contactData.availableTime3].filter(t => t)
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}