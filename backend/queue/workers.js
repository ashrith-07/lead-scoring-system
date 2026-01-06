const eventQueue = require('./eventQueue');
const eventProcessor = require('../services/eventProcessor');

function startWorkers() {
  eventQueue.process('process-event', 5, async (job) => {
    const { eventData } = job.data;

    try {
      const result = await eventProcessor.createAndProcessEvent(eventData);

      if (result.duplicate) {
        return {
          success: true,
          duplicate: true,
          message: 'Event already exists (idempotent)',
        };
      }

      if (!result.success) {
        throw new Error(result.error || 'Processing failed');
      }

      return {
        success: true,
        lead_id: result.result.lead.id,
        new_score: result.result.lead.new_score,
        points_awarded: result.result.event.points_awarded,
        message: 'Event processed successfully',
      };
    } catch (error) {
      console.error('Worker error:', error);
      throw error;
    }
  });

  eventQueue.process('process-batch', 2, async (job) => {
    const { events } = job.data;

    try {
      const results = {
        total: events.length,
        successful: 0,
        failed: 0,
        duplicates: 0,
      };

      for (let i = 0; i < events.length; i++) {
        try {
          const result = await eventProcessor.createAndProcessEvent(events[i]);

          if (result.duplicate) {
            results.duplicates++;
          } else if (result.success) {
            results.successful++;
          } else {
            results.failed++;
          }

          await job.progress(((i + 1) / events.length) * 100);
        } catch (error) {
          results.failed++;
        }
      }

      return {
        success: true,
        results,
        message: 'Batch processing completed',
      };
    } catch (error) {
      console.error('Batch worker error:', error);
      throw error;
    }
  });

  console.log('✅ Queue workers started');
  console.log('   - process-event: 5 concurrent jobs');
  console.log('   - process-batch: 2 concurrent jobs');
}

async function stopWorkers() {
  await eventQueue.close();
  console.log('Queue workers stopped');
}

module.exports = {
  startWorkers,
  stopWorkers,
};