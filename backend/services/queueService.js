const eventQueue = require('../queue/eventQueue');

class QueueService {
  async addEventToQueue(eventData, priority = 0) {
    const job = await eventQueue.add(
      'process-event',
      { eventData },
      {
        priority,
        jobId: eventData.event_id,
      }
    );

    return {
      job_id: job.id,
      event_id: eventData.event_id,
      status: 'queued',
      message: 'Event added to processing queue',
    };
  }

  async addBatchToQueue(events, priority = 0) {
    const batchId = `batch_${Date.now()}`;

    const job = await eventQueue.add(
      'process-batch',
      { events },
      {
        priority,
        jobId: batchId,
      }
    );

    return {
      job_id: job.id,
      batch_id: batchId,
      event_count: events.length,
      status: 'queued',
      message: 'Batch added to processing queue',
    };
  }

  async getJobStatus(jobId) {
    const job = await eventQueue.getJob(jobId);

    if (!job) {
      return {
        found: false,
        message: 'Job not found',
      };
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      found: true,
      job_id: job.id,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failed_reason: job.failedReason,
      attempts_made: job.attemptsMade,
      created_at: new Date(job.timestamp),
    };
  }

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      eventQueue.getWaitingCount(),
      eventQueue.getActiveCount(),
      eventQueue.getCompletedCount(),
      eventQueue.getFailedCount(),
      eventQueue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  async getQueueJobs(status = 'waiting', start = 0, end = 10) {
    let jobs;

    switch (status) {
      case 'waiting':
        jobs = await eventQueue.getWaiting(start, end);
        break;
      case 'active':
        jobs = await eventQueue.getActive(start, end);
        break;
      case 'completed':
        jobs = await eventQueue.getCompleted(start, end);
        break;
      case 'failed':
        jobs = await eventQueue.getFailed(start, end);
        break;
      case 'delayed':
        jobs = await eventQueue.getDelayed(start, end);
        break;
      default:
        jobs = [];
    }

    return jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress(),
      attempts_made: job.attemptsMade,
      timestamp: new Date(job.timestamp),
    }));
  }

  async retryFailedJob(jobId) {
    const job = await eventQueue.getJob(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    await job.retry();

    return {
      success: true,
      job_id: jobId,
      message: 'Job queued for retry',
    };
  }

  async removeJob(jobId) {
    const job = await eventQueue.getJob(jobId);

    if (!job) {
      throw new Error('Job not found');
    }

    await job.remove();

    return {
      success: true,
      job_id: jobId,
      message: 'Job removed',
    };
  }

  async cleanQueue(grace = 5000) {
    await eventQueue.clean(grace, 'completed');
    await eventQueue.clean(grace, 'failed');

    return {
      success: true,
      message: 'Queue cleaned',
    };
  }

  async pauseQueue() {
    await eventQueue.pause();

    return {
      success: true,
      message: 'Queue paused',
    };
  }

  async resumeQueue() {
    await eventQueue.resume();

    return {
      success: true,
      message: 'Queue resumed',
    };
  }

  async emptyQueue() {
    await eventQueue.empty();

    return {
      success: true,
      message: 'Queue emptied',
    };
  }
}

module.exports = new QueueService();