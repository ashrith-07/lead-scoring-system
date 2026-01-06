require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const { testRedisConnection } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.json({
    message: '🚀 Lead Scoring System API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const redisConnected = await testRedisConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        redis: redisConnected ? 'connected' : 'disconnected',
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

// app.use('/api/leads', require('./routes/leads'));
// app.use('/api/events', require('./routes/events'));
// app.use('/api/scores', require('./routes/scores'));
// app.use('/api/rules', require('./routes/rules'));
// app.use('/api/upload', require('./routes/upload'));

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const startServer = async () => {
  try {
    console.log('🔧 Initializing Lead Scoring System...\n');
    await connectDB();
    const redisOk = await testRedisConnection();
    if (!redisOk) {
      console.warn('⚠️  Warning: Redis is not connected. Queue system will not work.');
    }
    
    const ScoringRule = require('./models/ScoringRule');
    await ScoringRule.initializeDefaults();
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  console.log('\n SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});
