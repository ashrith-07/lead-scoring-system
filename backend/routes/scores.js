const express = require('express');
const router = express.Router();
const { ScoreHistory, Lead } = require('../models');
const scoringEngine = require('../services/scoringEngine');
const { param, query } = require('express-validator');
const { validate, queryValidation } = require('../middleware/validator');

router.get('/', queryValidation.pagination, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      ScoreHistory.find()
        .sort({ timestamp: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .populate('lead_id', 'name email current_score')
        .populate('event_id', 'event_type event_id'),
      ScoreHistory.countDocuments(),
    ]);

    res.json({
      success: true,
      data: history,
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

router.get('/recent', async (req, res, next) => {
  try {
    const { limit = 50 } = req.query;

    const history = await ScoreHistory.getRecent(parseInt(limit));

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const stats = await ScoreHistory.getStatsByReason();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/big-movers', async (req, res, next) => {
  try {
    const { days = 7, limit = 10 } = req.query;

    const movers = await ScoreHistory.getBigMovers(parseInt(days), parseInt(limit));

    res.json({
      success: true,
      data: movers,
      count: movers.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/lead/:lead_id', [param('lead_id').isMongoId().withMessage('Invalid lead ID'), validate], async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;

    const history = await ScoreHistory.getByLead(req.params.lead_id, parseInt(limit));

    res.json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/lead/:lead_id/trend', [param('lead_id').isMongoId().withMessage('Invalid lead ID'), validate], async (req, res, next) => {
  try {
    const { days = 30 } = req.query;

    const trend = await ScoreHistory.getScoreTrend(req.params.lead_id, parseInt(days));

    res.json({
      success: true,
      data: trend,
      count: trend.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/lead/:lead_id/breakdown', [param('lead_id').isMongoId().withMessage('Invalid lead ID'), validate], async (req, res, next) => {
  try {
    const breakdown = await scoringEngine.getLeadScoreBreakdown(req.params.lead_id);

    res.json({
      success: true,
      data: breakdown,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/lead/:lead_id/recalculate', [param('lead_id').isMongoId().withMessage('Invalid lead ID'), validate], async (req, res, next) => {
  try {
    const result = await scoringEngine.recalculateLeadScore(req.params.lead_id);

    res.json({
      success: true,
      data: result,
      message: 'Score recalculated successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/date-range', 
  [
    query('start_date').isISO8601().withMessage('Invalid start date'),
    query('end_date').isISO8601().withMessage('Invalid end date'),
    validate,
  ], 
  async (req, res, next) => {
    try {
      const { start_date, end_date } = req.query;

      const history = await ScoreHistory.getByDateRange(new Date(start_date), new Date(end_date));

      res.json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;