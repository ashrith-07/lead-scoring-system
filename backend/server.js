require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');

const connectDB = require('./config/database');
const { testRedisConnection } = require('./config/redis');
const { startWorkers } = require('./queue/workers');
const errorHandler = require('./middleware/errorHandler');
const socketManager = require('./socket/socketManager');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000', 
  'https://lead-scoring-system-beta.vercel.app', 
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS error: ${origin} not allowed`));
    }
  },
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

app.use('/api/leads', require('./routes/leads'));
app.use('/api/events', require('./routes/events'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/rules', require('./routes/rules'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/websocket', require('./routes/websocket'));

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    console.log('🔧 Initializing Lead Scoring System...\n');
    
    await connectDB();
    
    const redisOk = await testRedisConnection();
    if (!redisOk) {
      console.warn(' Warning: Redis is not connected. Queue system will not work.\n');
    } else {
      startWorkers();
    }
    
    const ScoringRule = require('./models/ScoringRule');
    await ScoringRule.initializeDefaults();
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(` Server is running on port ${PORT}`);
    });

    const socketManager = require('./socket/socketManager');
    socketManager.initialize(server);
    
  } catch (error) {
    console.error(' Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
