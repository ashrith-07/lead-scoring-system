const Queue = require('bull');
const { redisConfig } = require('../config/redis');

const eventQueue = new Queue('event-processing', {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 1000,
  },
});

eventQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

eventQueue.on('waiting', (jobId) => {
  console.log(`Job ${jobId} is waiting`);
});

eventQueue.on('active', (job) => {
  console.log(`Job ${job.id} started processing`);
});

eventQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result.message);
});

eventQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

eventQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} stalled`);
});

module.exports = eventQueue;