/// This file: defines an AvailableJob model using Mongoose (MongoDB ODM)
/// that serves as the main job/appointment data structure for the renovation portal system
/// Creates a comprehensive job schema that handles homeowner project requests, contractor bookings, and appointment scheduling
/// with integration to GoHighLevel (GHL) calendar system and contractor feedback tracking

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

  // Available and Booked Time Tracking
  availableTimes: [{ type: String }],

  // Conflicts detected during job creation
  conflicts: [{ /// tracks appointment times that were filtered out due to being too close to other appointments (must be 1.5+ hours apart)
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

  // Contractor Feedback
  feedback: [{
    contractorId: { type: String, ref: 'User', required: true },
    contractorName: { type: String, required: true },
    appointmentTime: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    submittedAt: { type: Date, default: Date.now }
  }],



  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },

  homeownerTags: {
    type: [String],
    default: []
  },

  // ADD THIS NEW FIELD ↓
  maxBookings: {
    type: Number,
    default: 3,
    min: 1
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