const express = require('express');
const router = express.Router();
const socketManager = require('../socket/socketManager');

router.get('/stats', (req, res) => {
  try {
    const stats = socketManager.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.post('/test-emit', (req, res) => {
  try {
    const { type, data } = req.body;

    switch (type) {
      case 'score_update':
        socketManager.emitScoreUpdate(data.lead_id, data);
        break;
      case 'event_processed':
        socketManager.emitEventProcessed(data);
        break;
      case 'leaderboard_update':
        socketManager.emitLeaderboardUpdate(data);
        break;
      case 'queue_stats':
        socketManager.emitQueueStats(data);
        break;
      case 'rule_update':
        socketManager.emitRuleUpdate(data);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid emit type',
        });
    }

    res.json({
      success: true,
      message: `${type} event emitted`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;