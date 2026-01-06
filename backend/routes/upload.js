const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const batchProcessor = require('../services/batchProcessor');
const queueService = require('../services/queueService');

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.csv', '.json'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV and JSON files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post('/file', upload.single('file'), async (req, res, next) => {
  let filePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase() === '.csv' ? 'csv' : 'json';

    console.log(`Processing ${fileType} file: ${filePath}`);

    const result = await batchProcessor.processBatchFile(filePath, fileType);

    res.json({
      success: true,
      data: result,
      message: 'File processed successfully',
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log('Cleaned up file after error');
      } catch (unlinkError) {
        console.error('Failed to clean up file:', unlinkError);
      }
    }
    
    next(error);
  }
});

router.post('/batch', async (req, res, next) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Events array is required and must not be empty',
      });
    }

    const validation = batchProcessor.validateBatchData(events);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const result = await batchProcessor.processBatchArray(validation.valid_events);

    res.json({
      success: true,
      data: result,
      message: 'Batch processed successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/batch-queue', async (req, res, next) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Events array is required and must not be empty',
      });
    }

    const validation = batchProcessor.validateBatchData(events);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    const queueResult = await queueService.addBatchToQueue(validation.valid_events);

    res.status(202).json({
      success: true,
      data: queueResult,
      message: 'Batch queued for processing',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/queue/stats', async (req, res, next) => {
  try {
    const stats = await queueService.getQueueStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/queue/jobs/:status', async (req, res, next) => {
  try {
    const { status } = req.params;
    const { start = 0, end = 10 } = req.query;

    const jobs = await queueService.getQueueJobs(status, parseInt(start), parseInt(end));

    res.json({
      success: true,
      data: jobs,
      count: jobs.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/queue/job/:job_id', async (req, res, next) => {
  try {
    const status = await queueService.getJobStatus(req.params.job_id);

    if (!status.found) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/queue/job/:job_id/retry', async (req, res, next) => {
  try {
    const result = await queueService.retryFailedJob(req.params.job_id);

    res.json({
      success: true,
      data: result,
      message: 'Job retry initiated',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/queue/job/:job_id', async (req, res, next) => {
  try {
    const result = await queueService.removeJob(req.params.job_id);

    res.json({
      success: true,
      data: result,
      message: 'Job removed',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/queue/clean', async (req, res, next) => {
  try {
    const { grace = 5000 } = req.body;

    const result = await queueService.cleanQueue(parseInt(grace));

    res.json({
      success: true,
      data: result,
      message: 'Queue cleaned',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;