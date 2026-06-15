require('dotenv').config();
const mongoose = require('mongoose');
const { initializeDatabase, isConnected, getConnectionStatus } = require('./config/mongodb');
const Deployment = require('./models/Deployment');

/**
 * Test script to verify MongoDB connection and Deployment model
 */
async function testDatabaseConnection() {
  console.log('🧪 Testing MongoDB Connection and Deployment Model\n');
  
  try {
    // Test 1: Connection
    console.log('Test 1: Establishing MongoDB connection...');
    await initializeDatabase();
    console.log(`✅ Connection status: ${getConnectionStatus()}`);
    console.log(`✅ Is connected: ${isConnected()}\n`);

    // Test 2: Model exists
    console.log('Test 2: Verifying Deployment model...');
    console.log(`✅ Model name: ${Deployment.modelName}`);
    console.log(`✅ Collection name: ${Deployment.collection.name}\n`);

    // Test 3: Indexes
    console.log('Test 3: Checking indexes...');
    const indexes = await Deployment.collection.getIndexes();
    console.log('✅ Indexes created:');
    Object.keys(indexes).forEach(indexName => {
      console.log(`   - ${indexName}: ${JSON.stringify(indexes[indexName])}`);
    });
    console.log();

    // Test 4: Create sample deployment
    console.log('Test 4: Creating sample deployment...');
    const sampleDeployment = new Deployment({
      pipelineId: 'test-pipeline',
      buildNumber: 1,
      status: 'SUCCESS',
      duration: 125000,
      timestamp: new Date(),
      environment: 'dev',
      commitSha: 'abc123',
      commitAuthor: 'test-user',
      stages: [
        { name: 'checkout', duration: 5000, status: 'SUCCESS' },
        { name: 'install', duration: 45000, status: 'SUCCESS' },
        { name: 'test', duration: 75000, status: 'SUCCESS' },
      ],
    });

    await sampleDeployment.save();
    console.log('✅ Sample deployment created:');
    console.log(`   - ID: ${sampleDeployment._id}`);
    console.log(`   - Pipeline: ${sampleDeployment.pipelineId}`);
    console.log(`   - Build: ${sampleDeployment.buildNumber}`);
    console.log(`   - Status: ${sampleDeployment.status}`);
    console.log(`   - Duration: ${sampleDeployment.getFormattedDuration()}\n`);

    // Test 5: Query the deployment
    console.log('Test 5: Querying deployment...');
    const found = await Deployment.findById(sampleDeployment._id);
    console.log(`✅ Found deployment: ${found.pipelineId} #${found.buildNumber}\n`);

    // Test 6: Test static methods
    console.log('Test 6: Testing static methods...');
    const recentDeployments = await Deployment.getRecentDeployments('test-pipeline', 7);
    console.log(`✅ Recent deployments count: ${recentDeployments.length}`);

    const stats = await Deployment.getDeploymentStats('test-pipeline', 7);
    console.log('✅ Deployment stats:');
    console.log(`   - Total builds: ${stats.totalBuilds}`);
    console.log(`   - Success rate: ${stats.successRate}%`);
    console.log(`   - Avg duration: ${stats.avgDuration}ms\n`);

    // Test 7: Clean up
    console.log('Test 7: Cleaning up...');
    await Deployment.deleteOne({ _id: sampleDeployment._id });
    console.log('✅ Test deployment deleted\n');

    // Success
    console.log('🎉 All tests passed!\n');
    
    // Close connection
    await mongoose.connection.close();
    console.log('🛑 Connection closed');
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

// Run tests
testDatabaseConnection();
