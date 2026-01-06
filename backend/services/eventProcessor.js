const { Event, Lead } = require('../models');
const scoringEngine = require('./scoringEngine');

class EventProcessor {
  async checkIdempotency(eventId) {
    const existingEvent = await Event.findOne({ event_id: eventId });
    return {
      exists: !!existingEvent,
      event: existingEvent,
    };
  }

  async createEvent(eventData) {
    const validation = await scoringEngine.validateEvent(eventData);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const idempotencyCheck = await this.checkIdempotency(eventData.event_id);
    if (idempotencyCheck.exists) {
      return {
        created: false,
        duplicate: true,
        event: idempotencyCheck.event,
        message: 'Event already exists (idempotent)',
      };
    }

    const lead = await Lead.findById(eventData.lead_id);
    if (!lead) {
      throw new Error(`Lead not found: ${eventData.lead_id}`);
    }

    if (lead.is_deleted) {
      throw new Error(`Cannot create event for deleted lead: ${eventData.lead_id}`);
    }

    const event = await Event.create({
      event_id: eventData.event_id,
      event_type: eventData.event_type,
      lead_id: eventData.lead_id,
      timestamp: new Date(eventData.timestamp),
      metadata: eventData.metadata || {},
      source: eventData.source || 'api',
      processed: false,
    });

    return {
      created: true,
      duplicate: false,
      event,
      message: 'Event created successfully',
    };
  }

  async processEvent(eventId) {
    const event = await Event.findOne({ event_id: eventId });
    
    if (!event) {
      throw new Error(`Event not found: ${eventId}`);
    }

    if (event.processed) {
      return {
        processed: false,
        already_processed: true,
        event,
        message: 'Event already processed',
      };
    }

    try {
      const result = await scoringEngine.processEvent(event);
      
      return {
        processed: true,
        already_processed: false,
        result,
        message: 'Event processed successfully',
      };
    } catch (error) {
      await event.markAsFailed(error.message);
      throw error;
    }
  }

  async createAndProcessEvent(eventData) {
    const createResult = await this.createEvent(eventData);
    
    if (createResult.duplicate) {
      return {
        success: false,
        duplicate: true,
        event: createResult.event,
        message: 'Event already exists',
      };
    }

    try {
      const processResult = await this.processEvent(createResult.event.event_id);
      
      return {
        success: true,
        duplicate: false,
        created: true,
        processed: true,
        event: createResult.event,
        result: processResult.result,
        message: 'Event created and processed successfully',
      };
    } catch (error) {
      return {
        success: false,
        duplicate: false,
        created: true,
        processed: false,
        event: createResult.event,
        error: error.message,
        message: 'Event created but processing failed',
      };
    }
  }

  async processUnprocessedEvents(limit = 100) {
    const events = await Event.find({ processed: false })
      .sort({ timestamp: 1 })
      .limit(limit);

    const results = {
      total: events.length,
      successful: 0,
      failed: 0,
      details: [],
    };

    for (const event of events) {
      try {
        await scoringEngine.processEvent(event);
        results.successful += 1;
        results.details.push({
          event_id: event.event_id,
          status: 'success',
        });
      } catch (error) {
        results.failed += 1;
        results.details.push({
          event_id: event.event_id,
          status: 'failed',
          error: error.message,
        });
        await event.markAsFailed(error.message);
      }
    }

    return results;
  }

  async retryFailedEvents(maxRetries = 3) {
    const events = await Event.find({
      processed: false,
      retry_count: { $lt: maxRetries },
      processing_error: { $ne: null },
    }).sort({ timestamp: 1 });

    const results = {
      total: events.length,
      successful: 0,
      failed: 0,
      details: [],
    };

    for (const event of events) {
      try {
        await scoringEngine.processEvent(event);
        results.successful += 1;
        results.details.push({
          event_id: event.event_id,
          status: 'success',
          retry_count: event.retry_count,
        });
      } catch (error) {
        results.failed += 1;
        results.details.push({
          event_id: event.event_id,
          status: 'failed',
          error: error.message,
          retry_count: event.retry_count,
        });
        await event.markAsFailed(error.message);
      }
    }

    return results;
  }

  async handleOutOfOrderEvents(leadId) {
    const events = await Event.find({ 
      lead_id: leadId,
      processed: false 
    }).sort({ timestamp: 1 });

    if (events.length === 0) {
      return {
        message: 'No unprocessed events found',
        processed: 0,
      };
    }

    const results = {
      total: events.length,
      successful: 0,
      failed: 0,
    };

    for (const event of events) {
      try {
        await scoringEngine.processEvent(event);
        results.successful += 1;
      } catch (error) {
        results.failed += 1;
        await event.markAsFailed(error.message);
      }
    }

    return results;
  }

  async getEventStats() {
    const [totalEvents, processedEvents, failedEvents, eventsByType] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ processed: true }),
      Event.countDocuments({ processing_error: { $ne: null } }),
      Event.aggregate([
        {
          $group: {
            _id: '$event_type',
            count: { $sum: 1 },
            processed: {
              $sum: { $cond: ['$processed', 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $ne: ['$processing_error', null] }, 1, 0] }
            },
          }
        },
        {
          $sort: { count: -1 }
        }
      ])
    ]);

    return {
      total_events: totalEvents,
      processed_events: processedEvents,
      unprocessed_events: totalEvents - processedEvents,
      failed_events: failedEvents,
      processing_rate: totalEvents > 0 ? ((processedEvents / totalEvents) * 100).toFixed(2) + '%' : '0%',
      events_by_type: eventsByType,
    };
  }

  async bulkCreateEvents(eventsArray) {
    const results = {
      total: eventsArray.length,
      created: 0,
      duplicates: 0,
      errors: 0,
      details: [],
    };

    for (const eventData of eventsArray) {
      try {
        const validation = await scoringEngine.validateEvent(eventData);
        if (!validation.valid) {
          results.errors += 1;
          results.details.push({
            event_id: eventData.event_id,
            status: 'error',
            errors: validation.errors,
          });
          continue;
        }

        const createResult = await this.createEvent(eventData);
        
        if (createResult.duplicate) {
          results.duplicates += 1;
          results.details.push({
            event_id: eventData.event_id,
            status: 'duplicate',
          });
        } else {
          results.created += 1;
          results.details.push({
            event_id: eventData.event_id,
            status: 'created',
          });
        }
      } catch (error) {
        results.errors += 1;
        results.details.push({
          event_id: eventData.event_id,
          status: 'error',
          error: error.message,
        });
      }
    }

    return results;
  }
}

module.exports = new EventProcessor();