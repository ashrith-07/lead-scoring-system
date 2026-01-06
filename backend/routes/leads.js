const express = require('express');
const router = express.Router();
const { Lead, Event, ScoreHistory } = require('../models');
const { leadValidation, queryValidation } = require('../middleware/validator');
const { param } = require('express-validator');
const { validate } = require('../middleware/validator');

router.get('/', queryValidation.pagination, queryValidation.status, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, sortBy = 'current_score', order = 'desc' } = req.query;

    const query = { is_deleted: false };

    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { company: searchRegex },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj = { [sortBy]: sortOrder };

    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .sort(sortObj)
        .limit(parseInt(limit))
        .skip(skip)
        .select('-is_deleted'),
      Lead.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: leads,
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

router.get('/leaderboard', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const leads = await Lead.getLeaderboard(parseInt(limit));

    res.json({
      success: true,
      data: leads,
      count: leads.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req, res, next) => {
  try {
    const [totalLeads, statusBreakdown, avgScore] = await Promise.all([
      Lead.countDocuments({ is_deleted: false }),
      Lead.aggregate([
        { $match: { is_deleted: false } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Lead.aggregate([
        { $match: { is_deleted: false } },
        {
          $group: {
            _id: null,
            avg_score: { $avg: '$current_score' },
            max_score: { $max: '$current_score' },
            min_score: { $min: '$current_score' },
          },
        },
      ]),
    ]);

    const statusMap = { cold: 0, warm: 0, hot: 0 };
    statusBreakdown.forEach(item => {
      statusMap[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        total_leads: totalLeads,
        status_breakdown: statusMap,
        score_stats: avgScore[0] || { avg_score: 0, max_score: 0, min_score: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', [param('id').isMongoId().withMessage('Invalid lead ID'), validate], async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, is_deleted: false });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    const [recentEvents, scoreHistory] = await Promise.all([
      Event.find({ lead_id: lead._id }).sort({ timestamp: -1 }).limit(10),
      ScoreHistory.find({ lead_id: lead._id }).sort({ timestamp: -1 }).limit(10),
    ]);

    res.json({
      success: true,
      data: {
        lead,
        recent_events: recentEvents,
        score_history: scoreHistory,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', leadValidation.create, async (req, res, next) => {
  try {
    const { name, email, company, phone, metadata } = req.body;

    const existingLead = await Lead.findOne({ email: email.toLowerCase() });
    if (existingLead && !existingLead.is_deleted) {
      return res.status(400).json({
        success: false,
        error: 'Lead with this email already exists',
      });
    }

    const lead = await Lead.create({
      name,
      email: email.toLowerCase(),
      company,
      phone,
      metadata: metadata || {},
    });

    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead created successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', leadValidation.update, async (req, res, next) => {
  try {
    const { name, email, company, phone, metadata } = req.body;

    const lead = await Lead.findOne({ _id: req.params.id, is_deleted: false });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    if (email && email.toLowerCase() !== lead.email) {
      const existingLead = await Lead.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: lead._id },
        is_deleted: false,
      });
      
      if (existingLead) {
        return res.status(400).json({
          success: false,
          error: 'Email already in use by another lead',
        });
      }
    }

    if (name) lead.name = name;
    if (email) lead.email = email.toLowerCase();
    if (company !== undefined) lead.company = company;
    if (phone !== undefined) lead.phone = phone;
    if (metadata) lead.metadata = { ...lead.metadata, ...metadata };

    await lead.save();

    res.json({
      success: true,
      data: lead,
      message: 'Lead updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', [param('id').isMongoId().withMessage('Invalid lead ID'), validate], async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, is_deleted: false });

    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found',
      });
    }

    await lead.softDelete();

    res.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;