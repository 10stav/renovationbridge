///This file: This is a universal login API that handles authentication for all user types (users, admins, contractors) 
/// in our renovation portal system

/// this file is also a Next.js API route handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check environment variables
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET not configured' });
    }

    // Import dependencies
    const { connectToDatabase } = await import('../../../../lib/contractorPortal/utils/mongodb');
    const User = (await import('../../../../lib/contractorPortal/models/User')).default;
    const jwt = await import('jsonwebtoken');

    // Connect to database
    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ 
        error: 'No account found with this email address'
      });
    }

    // Check if user is approved (for contractors)
    if (user.role === 'contractor' && !user.isApproved) {
      return res.status(400).json({ 
        error: 'Your contractor account is pending approval'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(400).json({ 
        error: 'Invalid password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Return success with token
    return res.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyName: user.companyName,
        contractorTags: user.contractorTags,
        isApproved: user.isApproved
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}