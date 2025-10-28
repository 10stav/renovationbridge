import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import User from '../../../../lib/contractorPortal/models/User';
import jwt from 'jsonwebtoken';

const authenticateAdmin = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.userId);

  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return user;
};
const checkGHLTeamMember = async (email) => {
  try {
    const ghlApiKey = process.env.GHL_API_KEY_APPDEV;
    const ghlLocationId = process.env.GHL_LOCATION_ID_APPDEV;

    if (!ghlApiKey) {
      console.warn('⚠️ GHL_API_KEY_APPDEV not set');
      return { error: 'GHL_API_KEY_APPDEV not configured' };
    }

    console.log('🔍 Checking GHL for team member with email:', email);

    const response = await fetch(
      `https://services.leadconnectorhq.com/users/?locationId=${ghlLocationId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ GHL API error:', response.status, errorText);
      return {
        error: `GHL API returned ${response.status}`,
        details: errorText
      };
    }

    const data = await response.json();
    const allUsers = data.users || [];

    console.log('📦 GHL returned', allUsers.length, 'total team members');
    console.log('All emails found:', allUsers.map(u => u.email).join(', '));

    // Find team member by email
    const teamMember = allUsers.find(user =>
      user.email?.toLowerCase() === email.toLowerCase()
    );

    if (teamMember) {
      console.log('✅ Found team member in GHL:', teamMember.name, 'ID:', teamMember.id);
      return {
        id: teamMember.id,
        name: teamMember.name,
        email: teamMember.email
      };
    }

    console.log('❌ No matching team member found');

    return {
      error: 'No team member found',
      debug: {
        searchedEmail: email,
        totalUsers: allUsers.length,
        allEmails: allUsers.map(u => u.email) // All emails for debugging
      }
    };

  } catch (error) {
    console.error('❌ Error checking GHL:', error);
    return { error: error.message };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectToDatabase();

  try {
    await authenticateAdmin(req);

    const { name, email, password, phone, companyName, license } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Check if email already exists in our system
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered in our system'
      });
    }

    // Check if contractor exists as a GHL team member
    console.log('🔍 Verifying contractor exists as GHL team member...');
    const ghlTeamMember = await checkGHLTeamMember(email);

    if (!ghlTeamMember || ghlTeamMember.error) {
      const debugInfo = ghlTeamMember?.debug ?
        `\n\nDebug Info:\n- Searched for: ${ghlTeamMember.debug.searchedEmail}\n- Total team members found in GHL: ${ghlTeamMember.debug.totalUsers}\n- All emails found: ${ghlTeamMember.debug.allEmails?.join(', ')}` : '';

      return res.status(400).json({
        success: false,
        error: (ghlTeamMember?.error || 'Contractor not found in GoHighLevel team members.') + debugInfo
      });
    }

    console.log('✅ GHL verification passed, creating contractor in our system...');

    // Create new contractor with GHL link
    const contractor = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'contractor',
      phone: phone || '',
      companyName: companyName || '',
      license: license || '',
      isActive: true,
      contractorTags: [],
      ghlUserId: ghlTeamMember.id  // Store GHL team member ID (this is what gets assigned to appointments)
    });

    await contractor.save();

    console.log('✅ Admin created contractor:', contractor.name, 'with GHL User ID:', ghlTeamMember.id);

    res.json({
      success: true,
      message: 'Contractor created successfully and linked to GHL team member',
      contractor: {
        _id: contractor._id,
        name: contractor.name,
        email: contractor.email,
        role: contractor.role,
        ghlUserId: contractor.ghlUserId
      }
    });

  } catch (error) {
    console.error('❌ Error creating contractor:', error);

    if (error.message.includes('token') || error.message.includes('Admin')) {
      return res.status(401).json({ success: false, error: error.message });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create contractor',
      details: error.message
    });
  }
}