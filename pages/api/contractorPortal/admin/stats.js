///this file: Provides aggregated statistics and key metrics for the admin dashboard, giving administrators a quick overview of the contractor portal's current state
/// is also a Next.js API route handler 

///basically an admin dashboard statistics endpoint
import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import User from '../../../../lib/contractorPortal/models/User';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectToDatabase();

  try {
    await authenticateAdmin(req);

    console.log('Admin fetching dashboard stats...');

    const [
      totalContractors,
      activeContractors,
      availableJobs,
      claimedJobs
    ] = await Promise.all([
      User.countDocuments({ role: 'contractor' }),
      User.countDocuments({ role: 'contractor', isActive: true }),
      AvailableJob.countDocuments({ status: 'available' }),
      AvailableJob.countDocuments({ status: 'claimed' })
    ]);

    const stats = {
      contractors: {
        total: totalContractors,
        active: activeContractors
      },
      jobs: {
        available: availableJobs,
        claimed: claimedJobs,
        total: availableJobs + claimedJobs
      }
    };

    console.log('Dashboard stats:', stats);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    if (error.message.includes('token') || error.message.includes('Admin')) {
      return res.status(401).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
}