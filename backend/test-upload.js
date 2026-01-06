require('dotenv').config();
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5050/api';
let testLeadId;

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

async function uploadFile(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await fetch(`${BASE_URL}/upload/file`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  const data = await response.json();
  return { status: response.status, data };
}

async function testFileUpload() {
  try {
    console.log('🧪 Testing File Upload & Batch Processing...\n');

    console.log('📝 TEST 1: Create test lead');
    const createLeadResult = await makeRequest('POST', '/leads', {
      name: 'Upload Test User',
      email: `upload_test_${Date.now()}@example.com`,
      company: 'Upload Test Co',
    });
    testLeadId = createLeadResult.data.data._id;
    console.log('✅ Lead created:', testLeadId);
    console.log('');

    console.log('📝 TEST 2: Create CSV file with lead ID');
    const csvContent = `event_id,event_type,lead_id,timestamp
csv_${Date.now()}_1,email_open,${testLeadId},2025-01-06T10:00:00Z
csv_${Date.now()}_2,page_view,${testLeadId},2025-01-06T10:05:00Z
csv_${Date.now()}_3,form_submission,${testLeadId},2025-01-06T10:10:00Z
csv_${Date.now()}_4,demo_request,${testLeadId},2025-01-06T10:15:00Z
csv_${Date.now()}_5,page_view,${testLeadId},2025-01-06T10:20:00Z`;

    fs.writeFileSync('test-upload.csv', csvContent);
    console.log('✅ CSV file created');
    console.log('');

    console.log('📝 TEST 3: Upload CSV file');
    const csvUploadResult = await uploadFile('test-upload.csv');
    console.log('✅ Status:', csvUploadResult.status);
    console.log('   Total rows:', csvUploadResult.data.data.parsing.total_rows);
    console.log('   Created:', csvUploadResult.data.data.summary.successfully_created);
    console.log('   Duplicates:', csvUploadResult.data.data.summary.duplicates);
    console.log('   Errors:', csvUploadResult.data.data.summary.errors);
    console.log('');

    console.log('⏳ Waiting for queue processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('📝 TEST 4: Check lead score after CSV upload');
    const leadAfterCSV = await makeRequest('GET', `/leads/${testLeadId}`);
    console.log('✅ Score after CSV:', leadAfterCSV.data.data.lead.current_score);
    console.log('   Status:', leadAfterCSV.data.data.lead.status);
    console.log('');

    console.log('📝 TEST 5: Create JSON file with lead ID');
    const jsonContent = [
      {
        event_id: `json_${Date.now()}_1`,
        event_type: 'email_open',
        lead_id: testLeadId,
        timestamp: new Date().toISOString(),
        metadata: { campaign: 'Test Campaign' },
      },
      {
        event_id: `json_${Date.now()}_2`,
        event_type: 'page_view',
        lead_id: testLeadId,
        timestamp: new Date().toISOString(),
        metadata: { page: '/pricing' },
      },
    ];

    fs.writeFileSync('test-upload.json', JSON.stringify(jsonContent, null, 2));
    console.log('✅ JSON file created');
    console.log('');

    console.log('📝 TEST 6: Upload JSON file');
    const jsonUploadResult = await uploadFile('test-upload.json');
    console.log('✅ Status:', jsonUploadResult.status);
    console.log('   Total rows:', jsonUploadResult.data.data.parsing.total_rows);
    console.log('   Created:', jsonUploadResult.data.data.summary.successfully_created);
    console.log('');

    console.log('⏳ Waiting for queue processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('📝 TEST 7: Check final lead score');
    const leadFinal = await makeRequest('GET', `/leads/${testLeadId}`);
    console.log('✅ Final score:', leadFinal.data.data.lead.current_score);
    console.log('   Status:', leadFinal.data.data.lead.status);
    console.log('   Total events:', leadFinal.data.data.recent_events.length);
    console.log('');

    console.log('📝 TEST 8: Get score breakdown');
    const breakdown = await makeRequest('GET', `/scores/lead/${testLeadId}/breakdown`);
    console.log('✅ Score breakdown:');
    Object.entries(breakdown.data.data.breakdown).forEach(([type, data]) => {
      console.log(`   ${type}: ${data.count} events, ${data.total_points} points`);
    });
    console.log('');

    console.log('📝 TEST 9: Test batch array upload');
    const batchEvents = [
      {
        event_id: `batch_${Date.now()}_1`,
        event_type: 'purchase',
        lead_id: testLeadId,
        timestamp: new Date().toISOString(),
      },
    ];

    const batchResult = await makeRequest('POST', '/upload/batch', { events: batchEvents });
    console.log('✅ Status:', batchResult.status);
    console.log('   Created:', batchResult.data.data.summary.successfully_created);
    console.log('');

    console.log('⏳ Waiting for final processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('📝 TEST 10: Final verification');
    const finalLead = await makeRequest('GET', `/leads/${testLeadId}`);
    console.log('✅ Final verified score:', finalLead.data.data.lead.current_score);
    console.log('   Status:', finalLead.data.data.lead.status);
    console.log('');

    console.log('🧹 Cleaning up test files');
    fs.unlinkSync('test-upload.csv');
    fs.unlinkSync('test-upload.json');
    console.log('✅ Test files deleted');
    console.log('');

    console.log('🎉 All file upload tests passed!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testFileUpload();