import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['pageview', 'click'],
    required: true
  },
  page: {
    type: String,
    required: true,
    maxlength: 500
  },
  referrer: {
    type: String,
    default: '',
    maxlength: 1000
  },
  userAgent: {
    type: String,
    default: '',
    maxlength: 500
  },
  ip: {
    type: String,
    default: ''
  },
  sessionId: {
    type: String,
    default: ''
  },
  target: {
    type: String,
    default: '',
    maxlength: 200
  }
}, {
  timestamps: true
});

// Indexes for fast aggregation queries
analyticsSchema.index({ createdAt: -1 });
analyticsSchema.index({ type: 1, createdAt: -1 });
analyticsSchema.index({ sessionId: 1 });
analyticsSchema.index({ page: 1, createdAt: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
