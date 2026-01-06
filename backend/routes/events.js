const express = require('express');
const router = express.Router();
const { Event } = require('../models');
const eventProcessor = require('../services/eventProcessor');
const queueService = require('../services/queueService');
const { eventValidation, queryValidation } = require('../middleware/validator');
const { param, query } = require('express-validator');
const { validate } = require('../middleware/validator');

router.post('/', eventValidation.create, async (req, res, next) => {
  try {
    const { event_id, event_type, lead_id, timestamp, metadata } = req.body;

    const eventData = {
      event_id,
      event_type,
      lead_id,
      timestamp,
      metadata: metadata || {},
      source: 'api',
    };

    const queueResult = await queueService.addEventToQueue(eventData);

    res.status(202).json({
      success: true,
      data: queueResult,
      message: 'Event queued for processing',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/process-now', eventValidation.create, async (req, res, next) => {
  try {
    const { event_id, event_type, lead_id, timestamp, metadata } = req.body;

    const eventData = {
      event_id,
      event_type,
      lead_id,
      timestamp,
      metadata: metadata || {},
      source: 'api',
    };

    const result = await eventProcessor.createAndProcessEvent(eventData);

    if (result.duplicate) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        data: result.event,
        message: 'Event already exists',
      });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        message: result.message,
      });
    }

    res.status(201).json({
      success: true,
      data: result,
      message: 'Event processed successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', queryValidation.pagination, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, event_type, lead_id, processed, sortBy = 'timestamp', order = 'desc' } = req.query;

    const query = {};

    if (event_type) {
      query.event_type = event_type;
    }

    if (lead_id) {
      query.lead_id = lead_id;
    }

    if (processed !== undefined) {
      query.processed = processed === 'true';
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find(query)
        .sort(sortObj)
        .limit(parseInt(limit))
        .skip(skip)
        .populate('lead_id', 'name email current_score'),
      Event.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await eventProcessor.getEventStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:event_id', [param('event_id').notEmpty().withMessage('Event ID required'), validate], async (req, res, next) => {
  try {
    const event = await Event.findOne({ event_id: req.params.event_id })
      .populate('lead_id', 'name email current_score status');

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/retry-failed', async (req, res, next) => {
  try {
    const result = await eventProcessor.retryFailedEvents();

    res.json({
      success: true,
      data: result,
      message: 'Failed events retry completed',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/process-unprocessed', async (req, res, next) => {
  try {
    const { limit = 100 } = req.body;

    const result = await eventProcessor.processUnprocessedEvents(limit);

    res.json({
      success: true,
      data: result,
      message: 'Unprocessed events processed',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/lead/:lead_id', [param('lead_id').isMongoId().withMessage('Invalid lead ID'), validate], async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;

    const events = await Event.find({ lead_id: req.params.lead_id })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;