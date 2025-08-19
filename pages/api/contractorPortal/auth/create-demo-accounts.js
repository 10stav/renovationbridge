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
      console.log('✅ Demo admin created');
    }

    let contractor = await User.findOne({ email: 'contractor@test.com' });
    if (!contractor) {
      contractor = new User({
        name: 'Demo Contractor',
        email: 'contractor@test.com',
        password: 'contractor123',
        role: 'contractor',
        phone: '555-CONTRACT',
        companyName: 'Demo Construction Co',
        kitchenRemodeling: true,
        testTag2: false,
        isApproved: true
      });
      await contractor.save();
      console.log('✅ Demo contractor created');
    }

    res.json({
      success: true,
      message: 'Demo accounts created!',
      accounts: {
        admin: { email: 'admin@renovationbridge.com', password: 'admin123' },
        contractor: { email: 'contractor@test.com', password: 'contractor123' }
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