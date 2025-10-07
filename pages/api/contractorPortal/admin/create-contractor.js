import { connectToDatabase } from '../../../lib/contractorPortal/utils/mongodb';
import User from '../../../lib/contractorPortal/models/User';
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
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new contractor
    const contractor = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'contractor',
      phone: phone || '',
      companyName: companyName || '',
      license: license || '',
      isApproved: true,  // Auto-approve since admin is creating
      isActive: true,
      denied: false,
      contractorTags: []  // Start with no tags, admin assigns later
    });

    await contractor.save();

    console.log('✅ Admin created contractor:', contractor.name);

    res.json({
      success: true,
      message: 'Contractor created successfully',
      contractor: {
        _id: contractor._id,
        name: contractor.name,
        email: contractor.email,
        role: contractor.role
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