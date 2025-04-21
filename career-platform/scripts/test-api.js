// Simple script to test API endpoints
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Function to test an endpoint with different methods
async function testEndpoint(endpoint, methods = ['GET', 'POST', 'OPTIONS']) {
  console.log(`\n🧪 Testing endpoint: ${endpoint}`);
  console.log('================================================================');
  
  for (const method of methods) {
    try {
      console.log(`\n📡 Sending ${method} request to ${endpoint}...`);
      
      const options = {
        method,
        headers: {
          'Accept': 'application/json',
        }
      };
      
      // Add body for POST requests
      if (method === 'POST') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({
          resumeText: 'This is a sample resume text for testing API endpoints.'
        });
      }
      
      const response = await fetch(`${BASE_URL}${endpoint}`, options);
      
      console.log(`📊 Response status: ${response.status} ${response.statusText}`);
      
      // Log response headers
      console.log('📋 Response headers:');
      const headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log(headers);
      
      // Log response body for non-OPTIONS requests
      if (method !== 'OPTIONS') {
        const text = await response.text();
        try {
          const json = JSON.parse(text);
          console.log('📦 Response body (JSON):');
          console.log(json);
        } catch (e) {
          console.log('📦 Response body (text):');
          console.log(text);
        }
      }
    } catch (error) {
      console.error(`❌ Error testing ${method} ${endpoint}:`, error.message);
    }
    
    console.log('----------------------------------------------------------------');
  }
}

async function runTests() {
  // Test the debug endpoint first
  await testEndpoint('/api/debug-test');
  
  // Test the analyze-resume endpoint
  await testEndpoint('/api/analyze-resume');
}

console.log('🚀 Starting API endpoint tests...');
runTests()
  .then(() => console.log('✅ Tests completed'))
  .catch(err => console.error('❌ Test error:', err)); 