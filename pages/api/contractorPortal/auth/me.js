import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import User from '../../../../lib/contractorPortal/models/User';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectToDatabase();

  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use the simple contractorTags array directly
    const flatTags = user.contractorTags || [];
    
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        contractorTags: flatTags
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}