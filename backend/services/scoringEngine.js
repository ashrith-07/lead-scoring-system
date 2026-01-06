const mongoose = require("mongoose");
const { Lead, Event, ScoreHistory, ScoringRule } = require("../models");

class ScoringEngine {
  constructor() {
    this.maxScore = Number(process.env.MAX_SCORE) || 1000;
    this.rulesCache = new Map();
    this.lastCacheUpdate = null;
  }

  async loadRules() {
    const rules = await ScoringRule.find({ active: true });
    this.rulesCache.clear();

    rules.forEach((rule) => {
      this.rulesCache.set(rule.event_type, rule.points);
    });

    this.lastCacheUpdate = new Date();
    return rules;
  }

  async getPointsForEventType(eventType) {
    if (!this.lastCacheUpdate || Date.now() - this.lastCacheUpdate > 60_000) {
      await this.loadRules();
    }
    return this.rulesCache.get(eventType) || 0;
  }

  async validateEvent(eventData) {
    const errors = [];

    if (!eventData.event_id) errors.push("event_id is required");
    if (!eventData.event_type) errors.push("event_type is required");
    if (!eventData.lead_id) errors.push("lead_id is required");
    if (!eventData.timestamp) errors.push("timestamp is required");

    const validTypes = [
      "email_open",
      "page_view",
      "form_submission",
      "demo_request",
      "purchase",
    ];

    if (eventData.event_type && !validTypes.includes(eventData.event_type)) {
      errors.push("invalid event_type");
    }

    if (eventData.timestamp && new Date(eventData.timestamp) > new Date()) {
      errors.push("timestamp cannot be in the future");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  calculateNewScore(currentScore, points) {
    return Math.min(Math.max(currentScore + points, 0), this.maxScore);
  }

  determineStatus(score) {
    if (score >= 151) return "hot";
    if (score >= 51) return "warm";
    return "cold";
  }

  async processEvent(event) {
    const session = await mongoose.startSession();

    const useTransaction =
      mongoose.connection.readyState === 1 &&
      mongoose.connection.client.topology?.description?.type === "ReplicaSet";

    if (useTransaction) {
      session.startTransaction();
    }

    try {
      const lead = await Lead.findById(event.lead_id).session(session);

      if (!lead) {
        throw new Error(`Lead not found: ${event.lead_id}`);
      }

      if (lead.is_deleted) {
        throw new Error(`Lead is deleted: ${event.lead_id}`);
      }

      const points = await this.getPointsForEventType(event.event_type);

      const previousScore = lead.current_score;
      const previousStatus = lead.status;

      const newScore = this.calculateNewScore(previousScore, points);
      const newStatus = this.determineStatus(newScore);

      lead.current_score = newScore;
      lead.status = newStatus;
      lead.updated_at = new Date();
      await lead.save({ session });

      await event.markAsProcessed(points, session);

      const history = await ScoreHistory.create(
        [
          {
            lead_id: lead._id,
            event_id: event._id,
            previous_score: previousScore,
            new_score: newScore,
            points_changed: points,
            reason: event.event_type,
            previous_status: previousStatus,
            new_status: newStatus,
            timestamp: event.timestamp,
            metadata: event.metadata,
          },
        ],
        { session }
      );

      const rule = await ScoringRule.findOne({
        event_type: event.event_type,
      }).session(session);

      if (rule) {
        rule.times_applied += 1;
        rule.total_points_awarded += points;
        rule.last_applied = new Date();
        await rule.save({ session });
      }

      if (useTransaction) await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        lead: {
          id: lead._id,
          name: lead.name,
          email: lead.email,
          previous_score: previousScore,
          new_score: newScore,
          previous_status: previousStatus,
          new_status: newStatus,
        },
        event: {
          id: event._id,
          event_id: event.event_id,
          event_type: event.event_type,
          points_awarded: points,
        },
        history_id: history[0]._id,
      };
    } catch (error) {
      if (useTransaction) await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async recalculateLeadScore(leadId) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error(`Lead not found: ${leadId}`);

    const events = await Event.find({
      lead_id: leadId,
      processed: true,
    }).sort({ timestamp: 1 });

    let totalScore = 0;
    for (const event of events) {
      totalScore += event.points_awarded;
    }

    totalScore = Math.min(totalScore, this.maxScore);

    const previousScore = lead.current_score;

    lead.current_score = totalScore;
    lead.status = this.determineStatus(totalScore);
    lead.updated_at = new Date();
    await lead.save();

    return {
      lead_id: leadId,
      previous_score: previousScore,
      recalculated_score: totalScore,
      status: lead.status,
      events_counted: events.length,
    };
  }

  async getLeadScoreBreakdown(leadId) {
    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error(`Lead not found: ${leadId}`);

    const events = await Event.find({
      lead_id: leadId,
      processed: true,
    }).sort({ timestamp: -1 });

    const breakdown = {};
    let total = 0;

    events.forEach((event) => {
      if (!breakdown[event.event_type]) {
        breakdown[event.event_type] = {
          count: 0,
          total_points: 0,
        };
      }
      breakdown[event.event_type].count += 1;
      breakdown[event.event_type].total_points += event.points_awarded;
      total += event.points_awarded;
    });

    return {
      lead: {
        id: lead._id,
        name: lead.name,
        email: lead.email,
        current_score: lead.current_score,
        status: lead.status,
      },
      breakdown,
      calculated_total: total,
      total_events: events.length,
    };
  }
}

module.exports = new ScoringEngine();
