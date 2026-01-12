const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
  
  retryStrategy: (times) => {
    if (times > 10) {
      console.error('Redis connection failed after 10 attempts');
      return null;
    }
    const delay = Math.min(times * 1000, 3000);
    console.log(`Retrying Redis connection in ${delay}ms... (attempt ${times})`);
    return delay;
  },
  
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true,
  connectTimeout: 10000,
};

const testRedisConnection = async () => {
  try {
    const Redis = require('ioredis');
    const client = new Redis(redisConfig);
    
    await client.ping();
    client.disconnect();
    
    return true;
  } catch (error) {
    console.error('Redis connection failed:', error.message);
    return false;
  }
};

module.exports = {
  redisConfig,
  testRedisConnection,
};