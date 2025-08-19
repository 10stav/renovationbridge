import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
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
  
  // Tags
  kitchenRemodeling: { type: Boolean, default: false },
  bathroomRemodeling: { type: Boolean, default: false },
  roofing: { type: Boolean, default: false },
  bayArea: { type: Boolean, default: false },
  losAngeles: { type: Boolean, default: false },
  orangeCounty: { type: Boolean, default: false },
  groupA: { type: Boolean, default: false },
  groupB: { type: Boolean, default: false },
  groupC: { type: Boolean, default: false },
  
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
  ghlContactId: {
    type: String,
    default: null
  },
  
  ghlUserId: {
    type: String,
    default: null
  },
  
  // QuickBooks integration
  qbCustomerId: {
    type: String,
    default: null
  },
  
  // Login tracking
  lastLoginAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);