import axios from 'axios';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

/**
 * Create appointment in GoHighLevel calendar system
 */
export const createGHLAppointment = async (appointmentData) => {
  try {
    console.log('🔍 DEBUG: Received appointment data:', appointmentData);

    const {
      contactName,
      contactEmail,
      contactPhone,
      appointmentDate,
      appointmentTime,
      projectName,
      projectDescription,
      budget,
      homeownerName,
      homeownerEmail,
      homeownerPhone,
      selectedDate,
      selectedTime,
      teamMemberId
    } = appointmentData;

    // Normalize data
    const finalContactName = homeownerName || contactName;
    const finalContactEmail = homeownerEmail || contactEmail;
    const finalContactPhone = homeownerPhone || contactPhone;
    const finalDate = selectedDate || appointmentDate;
    const finalTime = selectedTime || appointmentTime;
    const finalProjectName = projectName || 'Renovation Project';

    console.log('📞 Contact already exists, using existing contact ID');

    // STEP 1: Create or find existing contact in GHL
    let contactId;

    try {
      const contactResponse = await axios.post(`${GHL_API_BASE}/contacts/`, {
        firstName: finalContactName.split(' ')[0] || finalContactName,
        lastName: finalContactName.split(' ').slice(1).join(' ') || '',
        email: finalContactEmail,
        phone: finalContactPhone,
        locationId: process.env.GHL_LOCATION_ID_APPDEV,
        tags: ['renovation-lead', 'website-booking'],
        customFields: [
          {
            key: 'project_name',
            field_value: finalProjectName
          },
          {
            key: 'project_budget',
            field_value: (budget || 'TBD').toString()
          },
          {
            key: 'project_description',
            field_value: projectDescription || 'Details to be discussed'
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY_APPDEV}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      });

      contactId = contactResponse.data.contact.id;
      console.log('✅ GHL Contact created in RB Test:', contactId);

    } catch (contactError) {
      if (contactError.response?.data?.meta?.contactId) {
        contactId = contactError.response.data.meta.contactId;
        console.log('✅ Using existing contact in RB Test:', contactId);
      } else {
        throw contactError;
      }
    }

    // STEP 2: Format times for GHL API
    const startTime24h = convertTo24Hour(finalTime);
    const endTime24h = addHour(startTime24h);

    const selectedSlotFormatted = `${finalDate}T${startTime24h}:00-07:00`;
    const startTimeFormatted = `${finalDate}T${startTime24h}:00-07:00`;
    const endTimeFormatted = `${finalDate}T${endTime24h}:00-07:00`;

    console.log('📅 Date:', finalDate);
    console.log('⏰ Start time:', startTimeFormatted);
    console.log('⏰ End time:', endTimeFormatted);

    // STEP 3: Create appointment
    const appointmentResponse = await axios.post(
      `${GHL_API_BASE}/calendars/events/appointments`,
      {
        calendarId: process.env.GHL_CALENDAR_ID_APPDEV,
        locationId: process.env.GHL_LOCATION_ID_APPDEV,
        contactId,
        selectedSlot: selectedSlotFormatted,
        startTime: startTimeFormatted,
        endTime: endTimeFormatted,
        title: `${finalProjectName} - Renovation Consultation`,
        selectedTimezone: 'America/Los_Angeles',
        appointmentStatus: 'confirmed',
        teamMemberId: teamMemberId || undefined,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY_APPDEV}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );

    console.log('✅ GHL Appointment created:', appointmentResponse.data.id);

    return {
      success: true,
      appointmentId: appointmentResponse.data.id,
      contactId: contactId,
      data: {
        scheduledDate: finalDate,
        scheduledTime: finalTime,
        customerName: finalContactName
      }
    };

  } catch (error) {
    console.error('❌ GoHighLevel Error:', error.response?.data || error.message);

    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
};

/**
 * Convert 12-hour time to 24-hour format
 */
const convertTo24Hour = (time12h) => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = parseInt(hours, 10) + 12;

  hours = hours.toString().padStart(2, '0');
  return `${hours}:${minutes || '00'}`;
};

/**
 * Add one hour to time
 */
const addHour = (time24h) => {
  const [hours, minutes] = time24h.split(':');
  const newHour = parseInt(hours, 10) + 1;
  return `${newHour.toString().padStart(2, '0')}:${minutes}`;
};

/**
 * Check if team member exists
 */
export const checkTeamMemberExists = async ({ name, email }) => {
  try {
    console.log('🔍 Checking if team member exists for:', name, email);

    const response = await axios.get(
      `${GHL_API_BASE}/users/?locationId=${process.env.GHL_LOCATION_ID_APPDEV}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GHL_API_KEY_APPDEV}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );

    const users = response.data.users || response.data;

    const match = users.find(user =>
      user.email?.toLowerCase() === email.toLowerCase()
    );

    if (match) {
      console.log('✅ Verified GHL team member found:', match.id);
      return {
        success: true,
        teamMemberId: match.id
      };
    } else {
      console.warn('⚠️ No matching team member found.');
      return {
        success: false,
        message: 'Contractor is not yet a team member.'
      };
    }

  } catch (error) {
    console.warn('❌ GHL lookup error:', error.response?.data || error.message);
    return {
      success: false,
      message: 'Contractor is not yet a team member.'
    };
  }
};