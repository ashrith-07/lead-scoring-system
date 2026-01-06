const mongoose = require('mongoose');

const scoringRuleSchema = new mongoose.Schema(
  {
    event_type: {
      type: String,
      required: [true, 'Event type is required'],
      unique: true,
      enum: {
        values: [
          'email_open',
          'page_view',
          'form_submission',
          'demo_request',
          'purchase',
        ],
        message: '{VALUE} is not a valid event type',
      },
      index: true,
    },
    points: {
      type: Number,
      required: [true, 'Points value is required'],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
    },
    conditions: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    max_frequency: {
      count: {
        type: Number,
        default: null,
      },
      period: {
        type: String,
        enum: ['hour', 'day', 'week', 'month'],
        default: 'day',
      },
    },
    times_applied: {
      type: Number,
      default: 0,
      min: 0,
    },
    total_points_awarded: {
      type: Number,
      default: 0,
    },
    last_applied: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    created_by: {
      type: String,
      default: 'system',
    },
    updated_by: {
      type: String,
      default: 'system',
    },
  },
  {
    timestamps: false,
    collection: 'scoring_rules',
  }
);

scoringRuleSchema.index({ active: 1, event_type: 1 });
scoringRuleSchema.index({ priority: 1 });

scoringRuleSchema.statics.getPoints = async function (eventType) {
  const rule = await this.findOne({ event_type: eventType, active: true });
  return rule ? rule.points : 0;
};

scoringRuleSchema.statics.getActive = async function () {
  return this.find({ active: true }).sort({ priority: 1, event_type: 1 });
};

scoringRuleSchema.statics.getAll = async function () {
  return this.find().sort({ active: -1, event_type: 1 });
};

scoringRuleSchema.statics.updatePoints = async function (
  eventType,
  newPoints,
  updatedBy = 'system'
) {
  return this.findOneAndUpdate(
    { event_type: eventType },
    { points: newPoints, updated_at: new Date(), updated_by: updatedBy },
    { new: true }
  );
};

scoringRuleSchema.statics.toggleActive = async function (eventType, active) {
  return this.findOneAndUpdate(
    { event_type: eventType },
    { active: active, updated_at: new Date() },
    { new: true }
  );
};

scoringRuleSchema.statics.initializeDefaults = async function () {
  const defaultRules = [
    {
      event_type: 'email_open',
      points: 10,
      description: 'Points awarded when a lead opens an email',
      priority: 1,
    },
    {
      event_type: 'page_view',
      points: 5,
      description: 'Points awarded when a lead views a webpage',
      priority: 2,
    },
    {
      event_type: 'form_submission',
      points: 20,
      description: 'Points awarded when a lead submits a form',
      priority: 3,
    },
    {
      event_type: 'demo_request',
      points: 50,
      description: 'Points awarded when a lead requests a demo',
      priority: 4,
    },
    {
      event_type: 'purchase',
      points: 100,
      description: 'Points awarded when a lead makes a purchase',
      priority: 5,
    },
  ];

  const results = [];

  for (const rule of defaultRules) {
    try {
      const res = await this.updateOne(
        { event_type: rule.event_type },     
        { $setOnInsert: rule },               
        { upsert: true }                      
      );

      if (res.upsertedCount > 0) {
        results.push({ event_type: rule.event_type, status: 'created', points: rule.points });
        console.log(`Created default rule: ${rule.event_type} (${rule.points} points)`);
      } else {
        results.push({ event_type: rule.event_type, status: 'exists' });
      }
    } catch (error) {
      console.error(`❌ Error creating rule ${rule.event_type}:`, error.message);
      results.push({ event_type: rule.event_type, status: 'error', error: error.message });
    }
  }

  return results;
};

scoringRuleSchema.statics.getStatistics = async function () {
  const rules = await this.find().sort({ times_applied: -1 });
  return rules.map((rule) => ({
    event_type: rule.event_type,
    points: rule.points,
    times_applied: rule.times_applied,
    total_points_awarded: rule.total_points_awarded,
    avg_per_application:
      rule.times_applied > 0
        ? (rule.total_points_awarded / rule.times_applied).toFixed(2)
        : 0,
    last_applied: rule.last_applied,
    active: rule.active,
  }));
};

scoringRuleSchema.methods.recordApplication = async function () {
  this.times_applied += 1;
  this.total_points_awarded += this.points;
  this.last_applied = new Date();
  this.updated_at = new Date();
  return this.save();
};

scoringRuleSchema.methods.canApply = async function (event, lead) {
  if (!this.active) return false;

  if (Object.keys(this.conditions).length > 0) {
   
  }

  if (this.max_frequency.count) {
   
  }

  return true;
};

scoringRuleSchema.pre('save', function () {
  this.updated_at = new Date();
});

scoringRuleSchema.virtual('displayName').get(function () {
  return this.event_type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
});

scoringRuleSchema.set('toJSON', { virtuals: true });
scoringRuleSchema.set('toObject', { virtuals: true });

const ScoringRule = mongoose.model('ScoringRule', scoringRuleSchema);

module.exports = ScoringRule;
