import mongoose from 'mongoose';

const availableJobSchema = new mongoose.Schema({
  // Customer Information from GHL
  customerId: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },

  // Project Details
  projectBudget: {
    type: String,
    default: 'TBD'
  },
  projectDescription: {
    type: String,
    default: ''
  },
  projectTimeline: {
    type: String,
    default: 'TBD'
  },

  // Location
  location: {
    name: String,
    address: String,
    city: String,
    state: String,
    fullAddress: String
  },

  // Job Status
  status: {
    type: String,
    enum: ['available', 'claimed', 'in-progress', 'completed', 'cancelled', 'removed'],
    default: 'available'
  },

  // Admin-Set Available Times
  adminSetTimes: {
    time1: { type: String, default: '' },
    time2: { type: String, default: '' },
    time3: { type: String, default: '' }
  },

  // Available and Booked Time Tracking
  availableTimes: [{ type: String }],

  // Conflicts detected during job creation
  conflicts: [{
    timeSlot: { type: String },
    conflictType: { type: String },
    conflictingJob: { type: String }
  }],

  bookedTimes: [{
    time: { type: String, required: true },
    contractorId: { type: String, ref: 'User', required: true },
    contractorName: { type: String, required: true },
    contractorEmail: { type: String, required: true },
    bookedAt: { type: Date, default: Date.now }
  }],

  // Multiple Appointments Support
  appointments: [{
    ghlAppointmentId: String,
    contractorInfo: {
      contractorId: String,
      name: String,
      email: String,
      phone: String
    },
    scheduledDate: String,
    scheduledTime: String,
    bookedAt: { type: Date, default: Date.now },
    notes: String
  }],

  // Assignment Info   // Assignment Info (Legacy - kept for compatibility)
  claimedBy: {
    type: String,
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  homeownerTags: {
    type: [String],
    default: []
  },

  // GHL Data
  ghlData: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Add indexes
availableJobSchema.index({ customerEmail: 1 });
availableJobSchema.index({ status: 1 });
availableJobSchema.index({ customerId: 1 });

export default mongoose.models.AvailableJob || mongoose.model('AvailableJob', availableJobSchema);