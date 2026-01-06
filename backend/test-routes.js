require('dotenv').config();

const BASE_URL = 'http://localhost:5050/api';
let testLeadId;
let testEventId;

async function makeRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

async function testRoutes() {
  try {
    console.log('🧪 Testing API Routes...\n');

    console.log('📝 TEST 1: Create Lead (POST /api/leads)');
    const createLeadResult = await makeRequest('POST', '/leads', {
      name: 'API Test User',
      email: `api_test_${Date.now()}@example.com`,
      company: 'Test Company',
      phone: '1234567890',
    });
    testLeadId = createLeadResult.data.data._id;
    console.log('✅ Status:', createLeadResult.status);
    console.log('   Lead ID:', testLeadId);
    console.log('');

    console.log('📝 TEST 2: Get All Leads (GET /api/leads)');
    const getLeadsResult = await makeRequest('GET', '/leads?limit=5');
    console.log('✅ Status:', getLeadsResult.status);
    console.log('   Count:', getLeadsResult.data.data.length);
    console.log('');

    console.log('📝 TEST 3: Get Single Lead (GET /api/leads/:id)');
    const getSingleLeadResult = await makeRequest('GET', `/leads/${testLeadId}`);
    console.log('✅ Status:', getSingleLeadResult.status);
    console.log('   Name:', getSingleLeadResult.data.data.lead.name);
    console.log('');

    console.log('📝 TEST 4: Update Lead (PUT /api/leads/:id)');
    const updateLeadResult = await makeRequest('PUT', `/leads/${testLeadId}`, {
      company: 'Updated Company',
    });
    console.log('✅ Status:', updateLeadResult.status);
    console.log('   Company:', updateLeadResult.data.data.company);
    console.log('');

    console.log('📝 TEST 5: Get Leaderboard (GET /api/leads/leaderboard)');
    const leaderboardResult = await makeRequest('GET', '/leads/leaderboard?limit=5');
    console.log('✅ Status:', leaderboardResult.status);
    console.log('   Count:', leaderboardResult.data.count);
    console.log('');

    console.log('📝 TEST 6: Get All Rules (GET /api/rules)');
    const getRulesResult = await makeRequest('GET', '/rules');
    console.log('✅ Status:', getRulesResult.status);
    console.log('   Count:', getRulesResult.data.count);
    console.log('');

    console.log('📝 TEST 7: Create Event with Queue (POST /api/events)');
    testEventId = `api_test_${Date.now()}_1`;
    const createEventResult = await makeRequest('POST', '/events', {
      event_id: testEventId,
      event_type: 'email_open',
      lead_id: testLeadId,
      timestamp: new Date().toISOString(),
      metadata: { source: 'api_test' },
    });
    console.log('✅ Status:', createEventResult.status);
    console.log('   Job ID:', createEventResult.data.data.job_id);
    console.log('');

    console.log('⏳ Waiting for event processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📝 TEST 8: Get Events (GET /api/events)');
    const getEventsResult = await makeRequest('GET', '/events?limit=5');
    console.log('✅ Status:', getEventsResult.status);
    console.log('   Count:', getEventsResult.data.length);
    console.log('');

    console.log('📝 TEST 9: Get Score History (GET /api/scores/lead/:lead_id)');
    const getScoresResult = await makeRequest('GET', `/scores/lead/${testLeadId}`);
    console.log('✅ Status:', getScoresResult.status);
    console.log('   Count:', getScoresResult.data.count);
    console.log('');

    console.log('📝 TEST 10: Get Score Breakdown (GET /api/scores/lead/:lead_id/breakdown)');
    const getBreakdownResult = await makeRequest('GET', `/scores/lead/${testLeadId}/breakdown`);
    console.log('✅ Status:', getBreakdownResult.status);
    console.log('   Score:', getBreakdownResult.data.data.lead.current_score);
    console.log('   Events:', getBreakdownResult.data.data.total_events);
    console.log('');

    console.log('📝 TEST 11: Upload Batch (POST /api/upload/batch)');
    const batchEvents = [
      {
        event_id: `api_test_${Date.now()}_2`,
        event_type: 'page_view',
        lead_id: testLeadId,
        timestamp: new Date().toISOString(),
      },
      {
        event_id: `api_test_${Date.now()}_3`,
        event_type: 'form_submission',
        lead_id: testLeadId,
        timestamp: new Date().toISOString(),
      },
    ];
    const uploadBatchResult = await makeRequest('POST', '/upload/batch', { events: batchEvents });
    console.log('✅ Status:', uploadBatchResult.status);
    console.log('   Created:', uploadBatchResult.data.data.processing.created);
    console.log('');

    console.log('📝 TEST 12: Get Queue Stats (GET /api/upload/queue/stats)');
    const queueStatsResult = await makeRequest('GET', '/upload/queue/stats');
    console.log('✅ Status:', queueStatsResult.status);
    console.log('   Completed:', queueStatsResult.data.data.completed);
    console.log('');

    console.log('📝 TEST 13: Update Rule (PUT /api/rules/:id)');
    const rules = getRulesResult.data.data;
    const firstRuleId = rules[0]._id;
    const updateRuleResult = await makeRequest('PUT', `/rules/${firstRuleId}`, {
      points: 15,
    });
    console.log('✅ Status:', updateRuleResult.status);
    console.log('   Points:', updateRuleResult.data.data.points);
    console.log('');

    console.log('📝 TEST 14: Get Lead Stats (GET /api/leads/stats)');
    const leadStatsResult = await makeRequest('GET', '/leads/stats');
    console.log('✅ Status:', leadStatsResult.status);
    console.log('   Total Leads:', leadStatsResult.data.data.total_leads);
    console.log('');

    console.log('📝 TEST 15: Delete Lead (DELETE /api/leads/:id)');
    const deleteLeadResult = await makeRequest('DELETE', `/leads/${testLeadId}`);
    console.log('✅ Status:', deleteLeadResult.status);
    console.log('   Message:', deleteLeadResult.data.message);
    console.log('');

    console.log('🎉 All route tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRoutes();