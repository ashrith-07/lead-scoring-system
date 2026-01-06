const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    event_id: {
      type: String,
      required: [true, "Event ID is required"],
      unique: true,
      index: true,
      trim: true,
    },

    event_type: {
      type: String,
      required: [true, "Event type is required"],
      enum: {
        values: [
          "email_open",
          "page_view",
          "form_submission",
          "demo_request",
          "purchase",
        ],
        message: "{VALUE} is not a valid event type",
      },
      index: true,
    },

    lead_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: [true, "Lead ID is required"],
      index: true,
    },
    timestamp: {
      type: Date,
      required: [true, "Timestamp is required"],
      index: true,
      validate: {
        validator: (v) => v <= new Date(),
        message: "Event timestamp cannot be in the future",
      },
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    points_awarded: {
      type: Number,
      default: 0,
      min: [0, "Points awarded cannot be negative"],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    source: {
      type: String,
      enum: ["webhook", "api", "batch_upload", "manual"],
      default: "api",
    },
    processed_at: {
      type: Date,
      default: null,
    },

    processing_error: {
      type: String,
      default: null,
    },

    retry_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },

    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    collection: "events",
  }
);
eventSchema.index({ processed: 1, timestamp: 1 });
eventSchema.index({ lead_id: 1, timestamp: -1 });
eventSchema.index({ event_type: 1, timestamp: -1 });
eventSchema.index({ processed: 1, retry_count: 1 });

eventSchema.methods.markAsProcessed = async function (points, session) {
  this.processed = true;
  this.processed_at = new Date();
  this.points_awarded = points;
  this.processing_error = null;
  this.updated_at = new Date();
  return await this.save({ session });
};

eventSchema.methods.markAsFailed = async function (error, session = null) {
  this.retry_count += 1;
  this.processing_error = error;
  this.updated_at = new Date();
  return session
    ? this.save({ session })
    : this.save();
};

eventSchema.methods.canRetry = function () {
  return this.retry_count < 3;
};

eventSchema.statics.getUnprocessed = async function (limit = 100) {
  return await this.find({ processed: false })
    .sort({ timestamp: 1 })
    .limit(limit)
    .populate("lead_id", "name email");
};

eventSchema.statics.getByLead = async function (leadId, limit = 100) {
  return await this.find({ lead_id: leadId })
    .sort({ timestamp: -1 })
    .limit(limit);
};

eventSchema.statics.eventExists = async function (eventId) {
  return !!(await this.findOne({ event_id: eventId }));
};

eventSchema.statics.getStats = async function () {
  return await this.aggregate([
    {
      $group: {
        _id: "$event_type",
        count: { $sum: 1 },
        total_points: { $sum: "$points_awarded" },
        avg_points: { $avg: "$points_awarded" },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

eventSchema.statics.getByDateRange = async function (startDate, endDate) {
  return await this.find({
    timestamp: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({ timestamp: -1 })
    .populate("lead_id", "name email current_score");
};

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
