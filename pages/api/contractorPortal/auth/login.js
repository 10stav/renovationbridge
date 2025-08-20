import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import User from '../../../../lib/contractorPortal/models/User';
import jwt from 'jsonwebtoken';

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

export default async function handler(req, res) {
  console.log('🔍 Login API called:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('✅ Connecting to database...');
    await connectToDatabase();
    console.log('✅ Database connected');

    const { email, password } = req.body;
    console.log('📧 Looking for user:', email);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    console.log('✅ User found, checking password...');
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (user.role === 'contractor' && !user.isApproved) {
      console.log('⏳ User pending approval');
      return res.status(403).json({ error: 'Account pending admin approval' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user._id, user.role);
    const flatTags = user.contractorTags || [];

    console.log('🎉 Login successful for:', user.name);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        kitchenRemodeling: user.kitchenRemodeling || false,
        testTag2: user.testTag2 || false,
        contractorTags: flatTags
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
}