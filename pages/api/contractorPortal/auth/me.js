// /pages/api/contractorPortal/auth/me.js  (or similar path)

import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import User from '../../../../lib/contractorPortal/models/User';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET not configured' });
    }

    await connectToDatabase();

    const authHeader = req.headers.authorization || req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify token; normalize auth errors to 401 to match client expectations
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const isExpired = err?.name === 'TokenExpiredError';
      return res.status(401).json({ error: isExpired ? 'Token expired' : 'Invalid token' });
    }

    const user = await User.findById(decoded.userId).select('-password -__v');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Always provide a flat contractorTags array
    const flatTags = Array.isArray(user.contractorTags) ? user.contractorTags : [];

    return res.json({
      success: true,
      user: {
        ...user.toObject(),
        contractorTags: flatTags,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}
