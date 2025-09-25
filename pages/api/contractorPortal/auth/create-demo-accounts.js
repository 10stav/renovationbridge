///this file: Next.js API route handler that serves as a development/testing utility for creating demo accounts

import { connectToDatabase } from '../../../../lib/contractorPortal/utils/mongodb';
import User from '../../../../lib/contractorPortal/models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await connectToDatabase();

  try {
    let admin = await User.findOne({ email: 'admin@renovationbridge.com' });
    if (!admin) {
      admin = new User({
        name: 'Demo Admin',
        email: 'admin@renovationbridge.com',
        password: 'admin123',
        role: 'admin',
        phone: '555-ADMIN'
      });
      await admin.save();
      console.log('Demo admin created');
    }

    // Create 3 test contractors
    const contractors = [
      {
        name: 'Test Contractor 1',
        email: 'contractor1@test.com',
        password: 'contractor123',
        phone: '555-TEST-1',
        companyName: 'Test Construction 1'
      },
      {
        name: 'Test Contractor 2',
        email: 'contractor2@test.com',
        password: 'contractor123',
        phone: '555-TEST-2',
        companyName: 'Test Construction 2'
      },
      {
        name: 'Test Contractor 3',
        email: 'contractor3@test.com',
        password: 'contractor123',
        phone: '555-TEST-3',
        companyName: 'Test Construction 3'
      }
    ];

    const createdContractors = [];

    for (const contractorData of contractors) {
      let contractor = await User.findOne({ email: contractorData.email });
      if (!contractor) {
        contractor = new User({
          ...contractorData,
          role: 'contractor',
          contractorTags: ['bay area', 'visible-to-all'], // Match your job tags
          isApproved: true,
          isActive: true
        });
        await contractor.save();
        console.log(`Created contractor: ${contractorData.name}`);
      }
      createdContractors.push({
        email: contractorData.email,
        password: contractorData.password
      });
    }


    res.json({
      success: true,
      message: 'Demo accounts created!',
      accounts: {
        admin: { email: 'admin@renovationbridge.com', password: 'admin123' },
        contractors: createdContractors // New array of 3 contractors
      }
    });

  } catch (error) {
    console.error('Error creating demo accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create demo accounts',
      details: error.message
    });
  }
}