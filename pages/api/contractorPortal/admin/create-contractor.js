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

// NEW FUNCTION: Check if contractor exists in GHL
const checkGHLContactExists = async (email) => {
  try {
    const ghlApiKey = process.env.GHL_API_KEY;
    const ghlLocationId = process.env.GHL_LOCATION_ID;

    if (!ghlApiKey) {
      console.warn('⚠️ GHL_API_KEY not set - skipping GHL verification');
      return null;
    }

    console.log('🔍 Checking GHL for contact with email:', email);

    // Search for contact by email in GHL
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${ghlLocationId}&email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('❌ GHL API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('📦 GHL response:', JSON.stringify(data, null, 2));

    // Check if contact exists and has "contractor" tag
    if (data.contact) {
      const contact = data.contact;
      const hasContractorTag = contact.tags?.some(tag => 
        tag.toLowerCase().includes('contractor')
      );

      if (hasContractorTag) {
        console.log('✅ Found contractor in GHL with ID:', contact.id);
        return {
          id: contact.id,
          name: contact.firstName + ' ' + contact.lastName,
          email: contact.email
        };
      } else {
        console.log('⚠️ Contact found but missing "contractor" tag');
        return null;
      }
    }

    console.log('❌ No matching contact found in GHL');
    return null;

  } catch (error) {
    console.error('❌ Error checking GHL:', error);
    return null;
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

    // NEW: Check if contractor exists in GHL first
    console.log('🔍 Verifying contractor exists in GHL...');
    const ghlContact = await checkGHLContactExists(email);

    if (!ghlContact) {
      return res.status(400).json({
        success: false,
        error: 'Contractor not found in GoHighLevel. Please create them as a contact in GHL first with the tag "contractor" and use the same email address.'
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
      contractorTags: [],  // Start with no tags, admin assigns later
      ghlContactId: ghlContact.id  // NEW: Store GHL contact ID for automation
    });

    await contractor.save();

    console.log('✅ Admin created contractor:', contractor.name, 'with GHL ID:', ghlContact.id);

    res.json({
      success: true,
      message: 'Contractor created successfully and linked to GHL',
      contractor: {
        _id: contractor._id,
        name: contractor.name,
        email: contractor.email,
        role: contractor.role,
        ghlContactId: contractor.ghlContactId
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