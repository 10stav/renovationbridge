///as of 10/6 cleanup, all code in here is being used and has some purpose, all else removed

/// This file: defines a User model using Mongoose (MongoDB ODM) 
/// that serves as the main user/contractor data structure for the renovation portal system

/// Creates a comprehensive user schema that handles multiple user types (users, admins, contractors) 
/// with role-based fields and integrations to external systems
import mongoose from 'mongoose'; /// needed for line 9
import bcrypt from 'bcryptjs'; /// needed for password function around end of file

const userSchema = new mongoose.Schema({ ///creates userSchema. schema = blueprint/template that defines what fields each user record can have and their rules. these get filled out when someone creates an account
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'contractor'],
    default: 'user'
  },

  // Contractor-specific fields
  companyName: {
    type: String,
    trim: true
  },
  license: {
    type: String,
    trim: true
  },



  // Approval system
  isApproved: {
    type: Boolean,
    default: function () {
      return this.role === 'admin';
    }
  },

  contractorTags: {
    type: [String],
    default: []
  },

  isActive: {
    type: Boolean,
    default: true
  },

  denied: {
    type: Boolean,
    default: false
  },

  // GoHighLevel integration
  ghlContactId: { /// This gets set when a CUSTOMER/homeowner becomes a contact in GHL
    type: String,
    default: null
  },

  ghlUserId: {  ///THIS is what gets set for contractors - The contractor's GHL team member ID (for calendar bookings)
    type: String, /// Admin manually enters this when approving a contractor
    default: null
  },


}, {
  timestamps: true ///  Automatically adds "createdAt" and "updatedAt" fields to every user record
});

// Hash password before saving
userSchema.pre('save', async function (next) { /// function to encrypt password
  if (!this.isModified('password')) return next(); /// This ENCRYPTS the password before saving to database
  this.password = await bcrypt.hash(this.password, 12); /// Turns "password123" into unreadable encrypted text
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);