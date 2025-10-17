/// This file: Allows authenticated admins to retrieve a list of all contractors in the system for 
// management purposes
/// is also a Next.js API route handler 

///not to be confused with jobs.js which exists in the same location as this file but is slightly different:
///contractors.js: "Who are my contractors and what's their status?"
///jobs.js: "What jobs are in the system and who's working on them?"
import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import User from '../../../../lib/contractorPortal/models/User';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';
import jwt from 'jsonwebtoken';

// Middleware to authenticate admin
const authenticateAdmin = async (req) => { ///same function as in action.js, already documented
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

export default async function handler(req, res) { ///same function as in action.js, already documented
  await connectToDatabase();

  try {
    const admin = await authenticateAdmin(req);

    if (req.method === 'GET') {
      // Get all contractors
      console.log('Admin fetching contractors…');

      const contractors = await User.find({
        role: 'contractor',
        isActive: true
      }).sort({ createdAt: -1 });

      console.log(`Found ${contractors.length} contractors`);

      return res.json({
        success: true,
        contractors: contractors.map(c => ({
          _id: c._id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          companyName: c.companyName,
          contractorTags: c.contractorTags || [],
          isActive: c.isActive,
          contractorGhlId: c.ghlUserId || null
        }))
      });
    }

    if (req.method === 'POST') {
      // Handle contractor actions (assign tags)
      return res.status(405).json({ error: 'Use specific action endpoints' });
    }

  } catch (error) {
    console.error(' Admin contractors error:', error);
    if (error.message.includes('token') || error.message.includes('Admin')) {
      return res.status(401).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Error processing request',
      error: error.message
    });
  }
}