///this file:
/// File Type: Next.js API route handler
/// (used to be [action].js, now just tags.js) if you're wondering why, it's explained here: Functionality: It's an admin-only endpoint that allows administrators to perform only 1 actions on contractor accounts:
// update tags. it used to let them do 3 actions, (approve, deny, update tags), but I removed the approve deny flow so now they just create the contractor inside the admin dashboard so only update tags here
import { connectToDatabase } from '../../../../../../lib/contractorPortal/utils/mongodb'; ///imports mongodb file from file path shown, which Establishes and manages MongoDB connections for the contractor portal application
import User from '../../../../../../lib/contractorPortal/models/User'; ///imports user, which is a model(object) in my repo which was built using uses Mongoose (MongoDB ODM) to serve as the main user/contractor data structure for the renovation portal system.
import jwt from 'jsonwebtoken'; /// Brings in the jsonwebtoken npm package functionality; Allows the file to create, verify, and decode JWT tokens

const authenticateAdmin = async (req) => { ///this function authenticates an already logged in admin by validating their admin status for each api request. the actual admin login happens in auth/login.js
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

export default async function handler(req, res) { /// this function makes sure we accept POST requests and rejects all other HTTP methods (GET, PUT, DELETE, etc.)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await connectToDatabase();

  try {
    await authenticateAdmin(req);
    const { id: contractorId } = req.query;
    const { tags } = req.body || {};

    const contractor = await User.findById(contractorId);
    if (!contractor) return res.status(404).json({ success: false, message: 'Contractor not found' });

    contractor.contractorTags = Array.isArray(tags) ? tags : [];
    await contractor.save();

    return res.json({ success: true, contractor: { contractorTags: contractor.contractorTags } });
  } catch (error) {
    const code = (error.message.includes('token') || error.message.includes('Admin')) ? 401 : 500;
    return res.status(code).json({ success: false, message: error.message });
  }
}