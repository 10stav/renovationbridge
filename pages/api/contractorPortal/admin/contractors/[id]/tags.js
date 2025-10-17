/// File: admin/contractors/[id]/tags.js
/// Type: Next.js API Route Handler
///
/// Purpose:
///   Allows authenticated admins to update contractor tags.
///   Previously, this file (named [action].js) also supported approve/deny
///   actions, but those were removed — contractors are now created directly
///   by admins inside the dashboard.
///
/// Dependencies:
///   - MongoDB connection utility (connectToDatabase)
///   - User model (Mongoose)
///   - JWT for admin authentication
///
/// Summary:
///   1. Authenticates admin using JWT
///   2. Finds contractor by ID from query param
///   3. Updates contractorTags (array of strings)
///   4. Returns updated tags JSON

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

export default async function handler(req, res) { /// this function makes sure we accept POST requests and rejects all other HTTP methods (GET, PUT, DELETE, etc.), when we use functions to play with this data (tags)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await connectToDatabase();

  try {
    await authenticateAdmin(req);
    const { id: contractorId } = req.query;
    const { tags } = req.body || {};

    const contractor = await User.findById(contractorId); ///makes sure the contractor is existing to be used by a function (since this is just the handler)
    if (!contractor) return res.status(404).json({ success: false, message: 'Contractor not found' }); 

    contractor.contractorTags = Array.isArray(tags) ? tags : [];
    await contractor.save();

    return res.json({ success: true, contractor: { contractorTags: contractor.contractorTags } }); ///makes sure that contractor has tags (by returning a json with the tags) so we can possibly change them in functions (handler functionality still)
  } catch (error) {
    const code = (error.message.includes('token') || error.message.includes('Admin')) ? 401 : 500;
    return res.status(code).json({ success: false, message: error.message });
  }
}