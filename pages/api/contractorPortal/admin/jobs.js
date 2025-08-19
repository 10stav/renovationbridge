import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import AvailableJob from '../../../../lib/contractorPortal/models/Availablejob';
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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectToDatabase();

  try {
    const admin = await authenticateAdmin(req);

    console.log('📋 Admin fetching available jobs...');

    const jobs = await AvailableJob.find({
      status: { $in: ['available', 'claimed'] }
    }).sort({ createdAt: -1 });

    console.log(`🏗️ Found ${jobs.length} jobs`);

    res.json({
      success: true,
      jobs: jobs.map(job => ({
        _id: job._id,
        customerName: job.customerName,
        customerEmail: job.customerEmail,
        customerPhone: job.customerPhone,
        projectBudget: job.projectBudget,
        projectDescription: job.projectDescription,
        location: job.location,
        status: job.status,
        availableTimes: job.availableTimes || [],
        adminSetTimes: job.adminSetTimes,
        bookedTimes: job.bookedTimes || [],
        appointments: job.appointments || [],
        homeownerTags: job.homeownerTags || [],
        claimedBy: job.claimedBy,
        createdAt: job.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching jobs:', error);
    if (error.message.includes('token') || error.message.includes('Admin')) {
      return res.status(401).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
}