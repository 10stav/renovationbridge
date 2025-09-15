import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import User from '../../../../lib/contractorPortal/models/User';
import jwt from 'jsonwebtoken';
import { checkTeamMemberExists } from '../../../../lib/contractorPortal/services/gohighlevel';

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET2, { expiresIn: '7d' });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectToDatabase();

  try {
    const { name, email, password, phone, companyName, kitchenRemodeling, testTag2 } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check GHL for team member
    const ghlCheck = await checkTeamMemberExists({ name, email });

    if (!ghlCheck.success) {
      return res.status(403).json({
        error: 'team member not found'
      });
    }

    // Create new contractor account
    const user = new User({
      name,
      email,
      password,
      role: 'contractor',
      phone,
      companyName,
      kitchenRemodeling: kitchenRemodeling || false,
      testTag2: testTag2 || false,
      isApproved: false
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Contractor account created! Please wait for admin approval before you can login.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}