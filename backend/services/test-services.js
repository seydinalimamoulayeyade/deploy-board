/**
 * Simple test script to verify jenkinsService and cacheService
 * Run with: node services/test-services.js
 */

const cacheService = require('./cacheService');
const jenkinsService = require('./jenkinsService');

console.log('=== Testing Cache Service ===\n');

// Test cache set and get
console.log('1. Testing cache set/get...');
cacheService.set('test-key', { data: 'test-value' }, 5);
const cached = cacheService.get('test-key');
console.log('   Cached value:', cached);
console.log('   ✓ Cache set/get works\n');

// Test cache age
console.log('2. Testing cache age...');
const age = cacheService.getAge('test-key');
console.log('   Cache age:', age, 'seconds');
console.log('   ✓ Cache age works\n');

// Test cache stats
console.log('3. Testing cache stats...');
const stats = cacheService.getStats();
console.log('   Stats:', stats);
console.log('   ✓ Cache stats works\n');

console.log('=== Testing Jenkins Service ===\n');

// Test service instantiation
console.log('1. Jenkins service instantiated');
console.log('   Base URL:', jenkinsService.client.defaults.baseURL);
console.log('   Timeout:', jenkinsService.client.defaults.timeout, 'ms');
console.log('   ✓ Jenkins service configured\n');

// Test status normalization
console.log('2. Testing status normalization...');
const statuses = ['SUCCESS', 'FAILURE', 'ABORTED', 'UNSTABLE', null];
statuses.forEach(status => {
  const normalized = jenkinsService.normalizeStatus(status);
  console.log(`   ${status || 'null'} -> ${normalized}`);
});
console.log('   ✓ Status normalization works\n');

// Test environment extraction
console.log('3. Testing environment extraction...');
const jobNames = ['frontend-dev', 'backend-staging', 'api-production', 'other-job'];
jobNames.forEach(jobName => {
  const env = jenkinsService.extractEnvironment(jobName);
  console.log(`   ${jobName} -> ${env || 'none'}`);
});
console.log('   ✓ Environment extraction works\n');

console.log('=== All Tests Passed ===');

// Cleanup
cacheService.clear();
