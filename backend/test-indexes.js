require('dotenv').config();
const mongoose = require('mongoose');
const { initializeDatabase } = require('./config/mongodb');
const Deployment = require('./models/Deployment');

/**
 * Test script to verify all required indexes are created
 * Requirements: 5.1, 5.2, 13.6
 */
async function testIndexes() {
  console.log('🧪 Testing MongoDB Indexes\n');
  
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await initializeDatabase();
    console.log('✅ Connected\n');

    // Wait for indexes to be built
    console.log('Building indexes...');
    await Deployment.init();
    console.log('✅ Indexes built\n');

    // Get all indexes
    console.log('Checking created indexes...\n');
    const indexes = await Deployment.collection.getIndexes();
    
    // Required indexes per design document
    const requiredIndexes = [
      { name: '_id_', key: { _id: 1 } },
      { name: 'pipelineId_1', key: { pipelineId: 1 } },
      { name: 'status_1', key: { status: 1 } },
      { name: 'timestamp_1', key: { timestamp: 1 } },
      { name: 'environment_1', key: { environment: 1 } },
      { name: 'pipelineId_1_timestamp_-1', key: { pipelineId: 1, timestamp: -1 } },
      { name: 'environment_1_timestamp_-1', key: { environment: 1, timestamp: -1 } },
      { name: 'pipelineId_1_environment_1_status_1', key: { pipelineId: 1, environment: 1, status: 1 } },
      { name: 'timestamp_-1', key: { timestamp: -1 } },
    ];

    console.log('📊 Index Verification:\n');
    
    let allIndexesPresent = true;
    for (const required of requiredIndexes) {
      const exists = indexes[required.name];
      if (exists) {
        console.log(`✅ ${required.name}: Found`);
        console.log(`   Keys: ${JSON.stringify(exists)}`);
      } else {
        console.log(`❌ ${required.name}: Missing`);
        allIndexesPresent = false;
      }
    }

    console.log(`\n📈 Total indexes: ${Object.keys(indexes).length}`);
    
    if (allIndexesPresent) {
      console.log('\n🎉 All required indexes are present!\n');
    } else {
      console.log('\n⚠️  Some required indexes are missing!\n');
    }

    // List all actual indexes
    console.log('📋 All indexes in collection:');
    Object.keys(indexes).forEach(indexName => {
      console.log(`   - ${indexName}`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log('\n🛑 Connection closed');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run test
testIndexes();
