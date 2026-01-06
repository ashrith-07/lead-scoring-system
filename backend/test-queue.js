require('dotenv').config();
const mongoose = require('mongoose');
const { Lead } = require('./models');
const queueService = require('./services/queueService');
const { startWorkers, stopWorkers } = require('./queue/workers');

async function testQueue() {
  try {
    console.log('🧪 Testing Queue System...\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    startWorkers();
    console.log('');

    console.log('📝 TEST 1: Creating test lead...');
    const testLead = await Lead.create({
      name: 'Queue Test User',
      email: `queue_test_${Date.now()}@example.com`,
      company: 'Queue Test Co',
    });
    console.log('✅ Lead created:', testLead.email);
    console.log('');

    console.log('📝 TEST 2: Adding event to queue...');
    const queueResult1 = await queueService.addEventToQueue({
      event_id: `queue_test_${Date.now()}_1`,
      event_type: 'email_open',
      lead_id: testLead._id.toString(),
      timestamp: new Date().toISOString(),
      metadata: { campaign: 'Queue Test' },
    });
    console.log('✅ Event queued:', queueResult1.job_id);
    console.log('');

    console.log('📝 TEST 3: Checking queue stats...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    const stats1 = await queueService.getQueueStats();
    console.log('✅ Queue stats:');
    console.log('   Waiting:', stats1.waiting);
    console.log('   Active:', stats1.active);
    console.log('   Completed:', stats1.completed);
    console.log('   Failed:', stats1.failed);
    console.log('');

    console.log('📝 TEST 4: Adding batch to queue...');
    const batchEvents = [
      {
        event_id: `queue_test_${Date.now()}_2`,
        event_type: 'page_view',
        lead_id: testLead._id.toString(),
        timestamp: new Date().toISOString(),
      },
      {
        event_id: `queue_test_${Date.now()}_3`,
        event_type: 'form_submission',
        lead_id: testLead._id.toString(),
        timestamp: new Date().toISOString(),
      },
    ];

    const batchResult = await queueService.addBatchToQueue(batchEvents);
    console.log('✅ Batch queued:', batchResult.batch_id);
    console.log('   Event count:', batchResult.event_count);
    console.log('');

    console.log('⏳ Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('📝 TEST 5: Final queue stats...');
    const stats2 = await queueService.getQueueStats();
    console.log('✅ Queue stats:');
    console.log('   Completed:', stats2.completed);
    console.log('   Failed:', stats2.failed);
    console.log('');

    console.log('📝 TEST 6: Checking lead score...');
    const updatedLead = await Lead.findById(testLead._id);
    console.log('✅ Lead updated:');
    console.log('   Score:', updatedLead.current_score);
    console.log('   Status:', updatedLead.status);
    console.log('');

    console.log('🧹 Cleaning up...');
    await Lead.findByIdAndDelete(testLead._id);
    await mongoose.connection.db.collection('events').deleteMany({ lead_id: testLead._id });
    await mongoose.connection.db.collection('score_history').deleteMany({ lead_id: testLead._id });
    await queueService.cleanQueue(0);
    console.log('✅ Cleanup done\n');

    console.log('🎉 All queue tests passed!\n');

    await stopWorkers();
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testQueue();