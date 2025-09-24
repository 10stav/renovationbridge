///this file:
/// File Type: Next.js API route handler
/// Functionality: It's an admin-only endpoint that allows administrators to perform three key actions on
/// contractor accounts: approve, deny, or update tags.
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectToDatabase();

  try {
    const admin = await authenticateAdmin(req);
    const { id: contractorId, action } = req.query;

    if (action === 'approve') {
      let { teamMemberId } = req.body;

      console.log("✅ Admin approving contractor:", contractorId);

      const contractor = await User.findById(contractorId);
      if (!contractor) {
        return res.status(404).json({ success: false, message: 'Contractor not found' });
      }

      // Auto-fetch GHL team members if teamMemberId is missing
      if (!teamMemberId) {
        console.log("🔍 No teamMemberId provided, attempting auto-match by email...");

        const ghlApiKey = process.env.GOHIGHLEVEL_API_KEY;
        const locationId = process.env.GOHIGHLEVEL_LOCATION_ID;

        const response = await fetch(`https://rest.gohighlevel.com/v1/locations/${locationId}/users/`, {
          headers: {
            Authorization: `Bearer ${ghlApiKey}`,
            'Content-Type': 'application/json',
          }
        });

        let data;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.error(' GHL non-JSON response:', text);
          return res.status(502).json({
            success: false,
            message: 'GHL API returned unexpected response',
            raw: text
          });
        }

        const teamMembers = data.users || [];
        const matched = teamMembers.find(
          member => member.email?.toLowerCase() === contractor.email.toLowerCase()
        );

        if (matched) {
          teamMemberId = matched.id;
          console.log(` Auto-matched GHL team member: ${matched.name} (${teamMemberId})`);
        } else {
          console.warn(` No GHL team member found with email ${contractor.email}`);
          return res.status(400).json({
            success: false,
            message: `No GHL team member found with email ${contractor.email}. Please manually enter the teamMemberId to approve this contractor.`
          });
        }
      }

      // Update contractor fields
      contractor.isApproved = true;
      contractor.isActive = true;
      contractor.denied = false;

      if (teamMemberId) {
        // Validate format
        if (!/^[a-zA-Z0-9_-]{10,}$/.test(teamMemberId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid team member ID format."
          });
        }

        // Check against GHL directly
        const ghlApiKey = process.env.GOHIGHLEVEL_API_KEY;
        const response = await fetch(`https://rest.gohighlevel.com/v1/users/${teamMemberId}`, {
          headers: {
            Authorization: `Bearer ${ghlApiKey}`,
            'Content-Type': 'application/json'
          }
        });

        const contentType = response.headers.get("content-type");
        if (!response.ok || !contentType?.includes("application/json")) {
          const raw = await response.text();
          console.error('❌ GHL response error while checking teamMemberId:', raw);

          return res.status(400).json({
            success: false,
            message: "GHL ID not found. Please double-check the ID in your GHL team members list."
          });
        }

        const ghlUser = await response.json();
        console.log(`✅ Confirmed GHL user: ${ghlUser.name || ghlUser.email}`);
        contractor.ghlUserId = teamMemberId;
      }

      await contractor.save();

      console.log(`🎉 Contractor approved: ${contractor.name}`);

      res.json({
        success: true,
        message: 'Contractor approved successfully',
        contractor: {
          _id: contractor._id,
          name: contractor.name,
          email: contractor.email,
          isApproved: contractor.isApproved,
          contractorGhlId: contractor.contractorGhlId || null,
        }
      });
    }

    else if (action === 'deny') {
      console.log(`❌ Admin denying contractor: ${contractorId}`);

      const contractor = await User.findByIdAndUpdate(
        contractorId,
        {
          isApproved: false,
          isActive: false,
          denied: true
        },
        { new: true }
      );

      if (!contractor) {
        return res.status(404).json({
          success: false,
          message: 'Contractor not found'
        });
      }

      console.log(`🚫 Contractor denied: ${contractor.name}`);

      res.json({
        success: true,
        message: 'Contractor denied successfully',
        contractor: {
          _id: contractor._id,
          name: contractor.name,
          email: contractor.email,
          isApproved: contractor.isApproved
        }
      });
    }

    else if (action === 'tags') {
      const { tags } = req.body;

      const contractor = await User.findById(contractorId);
      if (!contractor) {
        return res.status(404).json({ success: false, message: 'Contractor not found' });
      }

      // Update contractorTags directly
      contractor.contractorTags = tags;

      // Update booleans for all tag types
      contractor.kitchenRemodeling = tags.includes("kitchen remodeling");
      contractor.bathroomRemodeling = tags.includes("bathroom remodeling");
      contractor.roofing = tags.includes("roofing");
      contractor.bayArea = tags.includes("bay area");
      contractor.losAngeles = tags.includes("los angeles");
      contractor.orangeCounty = tags.includes("orange county");
      contractor.groupA = tags.includes("group a");
      contractor.groupB = tags.includes("group b");
      contractor.groupC = tags.includes("group c");

      await contractor.save();

      return res.json({ success: true, contractor: { contractorTags: contractor.contractorTags } });
    }

    else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

  } catch (error) {
    console.error('❌ Error in contractor action:', error);
    if (error.message.includes('token') || error.message.includes('Admin')) {
      return res.status(401).json({ success: false, message: error.message });
    }
    res.status(500).json({
      success: false,
      message: 'Error processing contractor action',
      error: error.message,
    });
  }
}