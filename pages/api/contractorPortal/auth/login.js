export default async function handler(req, res) {
  console.log('🔍 Login API called:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('✅ POST request received');
    console.log('📝 Request body:', req.body);

    // Test environment variables first
    if (!process.env.JWT_SECRET) {
      console.error('❌ Missing JWT_SECRET');
      return res.status(500).json({ error: 'Missing JWT_SECRET environment variable' });
    }

    if (!process.env.MONGODB_URI) {
      console.error('❌ Missing MONGODB_URI');
      return res.status(500).json({ error: 'Missing MONGODB_URI environment variable' });
    }

    console.log('✅ Environment variables present');

    // Test imports
    let connectToDatabase, User, jwt;
    
    try {
      console.log('📦 Importing dependencies...');
      const mongoModule = await import('../../../../lib/contractorPortal/utils/mongodb');
      connectToDatabase = mongoModule.connectToDatabase;
      console.log('✅ MongoDB module imported');
    } catch (error) {
      console.error('❌ Failed to import mongodb:', error);
      return res.status(500).json({ error: 'Failed to import database connection', details: error.message });
    }

    try {
      const userModule = await import('../../../../lib/contractorPortal/models/User');
      User = userModule.default;
      console.log('✅ User model imported');
    } catch (error) {
      console.error('❌ Failed to import User model:', error);
      return res.status(500).json({ error: 'Failed to import User model', details: error.message });
    }

    try {
      jwt = await import('jsonwebtoken');
      console.log('✅ JWT imported');
    } catch (error) {
      console.error('❌ Failed to import JWT:', error);
      return res.status(500).json({ error: 'Failed to import JWT', details: error.message });
    }

    // Test database connection
    try {
      console.log('🔌 Connecting to database...');
      await connectToDatabase();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return res.status(500).json({ error: 'Database connection failed', details: error.message });
    }

    // If we get here, everything is working
    return res.json({
      success: true,
      message: 'All systems working! Environment variables and imports successful.',
      hasJWT: !!process.env.JWT_SECRET,
      hasMongoDB: !!process.env.MONGODB_URI,
      body: req.body
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return res.status(500).json({ 
      error: 'Unexpected error in login route', 
      details: error.message,
      stack: error.stack 
    });
  }
}