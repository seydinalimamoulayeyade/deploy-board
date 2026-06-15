const mongoose = require('mongoose');

/**
 * Deployment Schema
 * Stores deployment history for CI/CD pipelines
 * Implements Requirements 5.1, 5.2
 */
const deploymentSchema = new mongoose.Schema({
  pipelineId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  buildNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'RUNNING', 'ABORTED'],
    required: true,
    index: true,
  },
  duration: {
    type: Number, // milliseconds
    required: false,
    min: 0,
  },
  timestamp: {
    type: Date,
    required: true,
    index: true,
    default: Date.now,
  },
  environment: {
    type: String,
    enum: ['dev', 'staging', 'production'],
    required: true,
    index: true,
    lowercase: true,
  },
  commitSha: {
    type: String,
    required: false,
    trim: true,
  },
  commitAuthor: {
    type: String,
    required: false,
    trim: true,
  },
  stages: [{
    name: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'RUNNING', 'ABORTED', 'SKIPPED'],
    },
  }],
  qualityMetrics: {
    bugs: {
      type: Number,
      min: 0,
    },
    codeSmells: {
      type: Number,
      min: 0,
    },
    coverage: {
      type: Number,
      min: 0,
      max: 100,
    },
    rating: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'E'],
    },
    qualityGateStatus: {
      type: String,
      enum: ['PASSED', 'FAILED'],
    },
  },
  artifacts: [{
    name: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      min: 0,
    },
    url: {
      type: String,
    },
  }],
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'deployments',
});

// Compound indexes for efficient querying
// Index for querying deployments by pipeline ordered by timestamp (most recent first)
deploymentSchema.index({ pipelineId: 1, timestamp: -1 });

// Index for querying deployments by environment ordered by timestamp
deploymentSchema.index({ environment: 1, timestamp: -1 });

// Compound index for filtering by pipeline, environment, and status
deploymentSchema.index({ pipelineId: 1, environment: 1, status: 1 });

// Index for timestamp-based queries (deployment history within date ranges)
deploymentSchema.index({ timestamp: -1 });

/**
 * Static method: Get recent deployments for a pipeline
 * @param {string} pipelineId - Pipeline identifier
 * @param {number} days - Number of days to look back
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>}
 */
deploymentSchema.statics.getRecentDeployments = async function(pipelineId, days = 7, status = null) {
  const query = {
    pipelineId,
    timestamp: {
      $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    },
  };

  if (status) {
    query.status = status;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .lean();
};

/**
 * Static method: Get deployment statistics for a pipeline
 * @param {string} pipelineId - Pipeline identifier
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>}
 */
deploymentSchema.statics.getDeploymentStats = async function(pipelineId, days = 7) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const stats = await this.aggregate([
    {
      $match: {
        pipelineId,
        timestamp: { $gte: startDate },
        status: { $in: ['SUCCESS', 'FAILED'] }, // Only completed builds
      },
    },
    {
      $group: {
        _id: '$pipelineId',
        totalBuilds: { $sum: 1 },
        successfulBuilds: {
          $sum: { $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0] },
        },
        failedBuilds: {
          $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] },
        },
        avgDuration: { $avg: '$duration' },
      },
    },
  ]);

  if (stats.length === 0) {
    return {
      totalBuilds: 0,
      successRate: 0,
      avgDuration: 0,
    };
  }

  const result = stats[0];
  return {
    totalBuilds: result.totalBuilds,
    successRate: result.totalBuilds > 0 
      ? ((result.successfulBuilds / result.totalBuilds) * 100).toFixed(2)
      : 0,
    avgDuration: Math.round(result.avgDuration || 0),
  };
};

/**
 * Static method: Get last successful builds for rollback
 * @param {string} pipelineId - Pipeline identifier
 * @param {string} environment - Environment name
 * @param {number} limit - Number of builds to return
 * @returns {Promise<Array>}
 */
deploymentSchema.statics.getStableBuilds = async function(pipelineId, environment, limit = 5) {
  return this.find({
    pipelineId,
    environment,
    status: 'SUCCESS',
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('buildNumber timestamp commitSha commitAuthor')
    .lean();
};

/**
 * Static method: Get latest deployment for an environment
 * @param {string} environment - Environment name
 * @returns {Promise<Array>}
 */
deploymentSchema.statics.getEnvironmentStatus = async function(environment) {
  return this.aggregate([
    {
      $match: { environment },
    },
    {
      $sort: { timestamp: -1 },
    },
    {
      $group: {
        _id: '$pipelineId',
        lastDeployment: { $first: '$$ROOT' },
      },
    },
    {
      $replaceRoot: { newRoot: '$lastDeployment' },
    },
  ]);
};

/**
 * Instance method: Check if deployment is in progress
 * @returns {boolean}
 */
deploymentSchema.methods.isInProgress = function() {
  return this.status === 'RUNNING';
};

/**
 * Instance method: Check if deployment was successful
 * @returns {boolean}
 */
deploymentSchema.methods.isSuccessful = function() {
  return this.status === 'SUCCESS';
};

/**
 * Instance method: Get duration in human-readable format
 * @returns {string}
 */
deploymentSchema.methods.getFormattedDuration = function() {
  if (!this.duration) return 'N/A';
  
  const seconds = Math.floor(this.duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

// Pre-save hook to validate data
deploymentSchema.pre('save', async function() {
  // Ensure timestamp is set
  if (!this.timestamp) {
    this.timestamp = new Date();
  }
  
  // Convert environment to lowercase
  if (this.environment) {
    this.environment = this.environment.toLowerCase();
  }
});

const Deployment = mongoose.model('Deployment', deploymentSchema);

module.exports = Deployment;
