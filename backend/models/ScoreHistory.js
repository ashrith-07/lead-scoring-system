const mongoose = require('mongoose');
const scoreHistorySchema = new mongoose.Schema(
  {
    lead_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead ID is required'],
      index: true, 
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true,
    },
    previous_score: {
      type: Number,
      required: [true, 'Previous score is required'],
      min: 0,
    },
    new_score: {
      type: Number,
      required: [true, 'New score is required'],
      min: 0,
    },
    points_changed: {
      type: Number,
      required: [true, 'Points changed is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      maxlength: [200, 'Reason cannot exceed 200 characters'],
    },
    previous_status: {
      type: String,
      enum: ['cold', 'warm', 'hot'],
      default: 'cold',
    },

    new_status: {
      type: String,
      enum: ['cold', 'warm', 'hot'],
      default: 'cold',
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      index: true, 
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    created_at: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    collection: 'score_history',
  }
);
scoreHistorySchema.index({ lead_id: 1, timestamp: -1 });

scoreHistorySchema.index({ event_id: 1 });

scoreHistorySchema.index({ timestamp: -1 });

scoreHistorySchema.index({ reason: 1, timestamp: -1 });


scoreHistorySchema.statics.getByLead = async function (leadId, limit = 100) {
  return await this.find({ lead_id: leadId })
    .sort({ timestamp: -1 }) 
    .limit(limit)
    .populate('event_id', 'event_type event_id source'); 
};


scoreHistorySchema.statics.getRecent = async function (limit = 50) {
  return await this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('lead_id', 'name email current_score')
    .populate('event_id', 'event_type');
};


scoreHistorySchema.statics.getScoreTrend = async function (leadId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const history = await this.find({
    lead_id: leadId,
    timestamp: { $gte: startDate },
  })
    .sort({ timestamp: 1 }) 
    .select('timestamp new_score');

  return history.map((record) => ({
    timestamp: record.timestamp,
    score: record.new_score,
  }));
};

scoreHistorySchema.statics.getStatsByReason = async function () {
  return await this.aggregate([
    {
      $group: {
        _id: '$reason',
        count: { $sum: 1 },
        total_points_added: {
          $sum: {
            $cond: [{ $gt: ['$points_changed', 0] }, '$points_changed', 0],
          },
        },
        avg_change: { $avg: '$points_changed' },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

scoreHistorySchema.statics.getByDateRange = async function (startDate, endDate) {
  return await this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({ timestamp: -1 })
    .populate('lead_id', 'name email')
    .populate('event_id', 'event_type');
};
scoreHistorySchema.statics.getBigMovers = async function (days = 7, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return await this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: '$lead_id',
        total_change: { $sum: '$points_changed' },
        num_changes: { $sum: 1 },
      },
    },
    {
      $sort: { total_change: -1 },
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: 'leads',
        localField: '_id',
        foreignField: '_id',
        as: 'lead',
      },
    },
    {
      $unwind: '$lead',
    },
  ]);
};

scoreHistorySchema.methods.getDescription = function () {
  const direction = this.points_changed > 0 ? 'increased' : 'decreased';
  const absChange = Math.abs(this.points_changed);

  return `Score ${direction} by ${absChange} points (${this.reason})`;
};

scoreHistorySchema.methods.isStatusChange = function () {
  return this.previous_status !== this.new_status;
};


scoreHistorySchema.virtual('changePercentage').get(function () {
  if (this.previous_score === 0) return 100;
  return ((this.points_changed / this.previous_score) * 100).toFixed(2);
});

scoreHistorySchema.set('toJSON', { virtuals: true });
scoreHistorySchema.set('toObject', { virtuals: true });


const ScoreHistory = mongoose.model('ScoreHistory', scoreHistorySchema);

module.exports = ScoreHistory;