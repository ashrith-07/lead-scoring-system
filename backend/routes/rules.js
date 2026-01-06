const express = require('express');
const router = express.Router();
const { ScoringRule } = require('../models');
const { ruleValidation } = require('../middleware/validator');
const { param } = require('express-validator');
const { validate } = require('../middleware/validator');

router.get('/', async (req, res, next) => {
  try {
    const rules = await ScoringRule.getAll();

    res.json({
      success: true,
      data: rules,
      count: rules.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/active', async (req, res, next) => {
  try {
    const rules = await ScoringRule.getActive();

    res.json({
      success: true,
      data: rules,
      count: rules.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await ScoringRule.getStatistics();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', [param('id').isMongoId().withMessage('Invalid rule ID'), validate], async (req, res, next) => {
  try {
    const rule = await ScoringRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found',
      });
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/type/:event_type', [param('event_type').notEmpty().withMessage('Event type required'), validate], async (req, res, next) => {
  try {
    const rule = await ScoringRule.findOne({ event_type: req.params.event_type });

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found for this event type',
      });
    }

    res.json({
      success: true,
      data: rule,
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', ruleValidation.update, async (req, res, next) => {
  try {
    const { points, active, description, priority } = req.body;

    const rule = await ScoringRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found',
      });
    }

    if (points !== undefined) rule.points = points;
    if (active !== undefined) rule.active = active;
    if (description) rule.description = description;
    if (priority !== undefined) rule.priority = priority;

    rule.updated_by = req.body.updated_by || 'api';

    await rule.save();

    res.json({
      success: true,
      data: rule,
      message: 'Rule updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/toggle', [param('id').isMongoId().withMessage('Invalid rule ID'), validate], async (req, res, next) => {
  try {
    const rule = await ScoringRule.findById(req.params.id);

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found',
      });
    }

    rule.active = !rule.active;
    await rule.save();

    res.json({
      success: true,
      data: rule,
      message: `Rule ${rule.active ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/initialize', async (req, res, next) => {
  try {
    const results = await ScoringRule.initializeDefaults();

    res.json({
      success: true,
      data: results,
      message: 'Default rules initialized',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;