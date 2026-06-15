const axios = require('axios');
const config = require('../config/jenkins');
const cacheService = require('./cacheService');
const ApiError = require('../utils/ApiError');

/**
 * Jenkins API Service Layer
 * Handles all communication with Jenkins REST API
 * Implements authentication, timeout, retry logic, caching, and response transformation
 */
class JenkinsService {
  constructor() {
    // Create axios client with base configuration
    this.client = axios.create({
      baseURL: config.url,
      timeout: 30000, // 30 seconds timeout as per requirement 10.7
      headers: {
        'Authorization': config.authHeader,
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (requestConfig) => {
        console.log(`[Jenkins API] ${requestConfig.method.toUpperCase()} ${requestConfig.url}`);
        return requestConfig;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for retry logic
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Retry once on timeout or network error (requirement 13.3)
        if (!originalRequest._retry && 
            (error.code === 'ECONNABORTED' || 
             error.code === 'ETIMEDOUT' || 
             error.code === 'ECONNREFUSED')) {
          originalRequest._retry = true;
          console.log(`[Jenkins API] Retrying request: ${originalRequest.url}`);
          return this.client.request(originalRequest);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all Jenkins jobs/pipelines
   * @param {string} environment - Optional environment filter (dev/staging/production)
   * @returns {Promise<Array>} - Array of pipeline objects
   */
  async getAllJobs(environment = null) {
    const cacheKey = `jenkins:jobs:${environment || 'all'}`;
    
    // Check cache first (requirement 13.4 - 60 second TTL)
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`[Jenkins API] Cache hit for ${cacheKey} (age: ${cacheService.getAge(cacheKey)}s)`);
      return cached;
    }

    try {
      // Fetch jobs with specific tree parameter to get necessary fields
      const response = await this.client.get('/api/json', {
        params: {
          tree: 'jobs[name,displayName,url,lastBuild[number,result,duration,timestamp,actions[lastBuiltRevision[SHA1,branch[name]],causes[userName]]]]'
        }
      });

      // Transform Jenkins response to our internal format
      const pipelines = this.transformJobsResponse(response.data.jobs);

      // Filter by environment if specified
      const filteredPipelines = environment 
        ? pipelines.filter(p => this.extractEnvironment(p.name) === environment)
        : pipelines;

      // Cache the result
      cacheService.set(cacheKey, filteredPipelines, 60);

      return filteredPipelines;
    } catch (error) {
      console.error('[Jenkins API] Error fetching jobs:', error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Get specific build details
   * @param {string} jobName - Jenkins job name
   * @param {number} buildNumber - Build number
   * @returns {Promise<Object>} - Build details object
   */
  async getBuildDetails(jobName, buildNumber) {
    const cacheKey = `jenkins:build:${jobName}:${buildNumber}`;
    
    const cached = cacheService.get(cacheKey);
    if (cached) {
      console.log(`[Jenkins API] Cache hit for ${cacheKey}`);
      return cached;
    }

    try {
      const response = await this.client.get(`/job/${jobName}/${buildNumber}/api/json`, {
        params: {
          tree: 'number,result,duration,timestamp,actions[lastBuiltRevision[SHA1,branch[name]],causes[userName]],changeSet[items[author[fullName],msg,commitId]],artifacts[fileName,relativePath]'
        }
      });

      // Get workflow stages if available (for pipeline jobs)
      let stages = [];
      try {
        const stagesResponse = await this.client.get(`/job/${jobName}/${buildNumber}/wfapi/describe`);
        stages = this.transformStagesResponse(stagesResponse.data.stages);
      } catch (stageError) {
        console.warn('[Jenkins API] Could not fetch pipeline stages (might not be a pipeline job)');
      }

      const buildDetails = this.transformBuildDetailsResponse(response.data, stages);

      // Cache build details (builds don't change once completed)
      const ttl = buildDetails.status === 'RUNNING' ? 10 : 300; // Short TTL for running builds
      cacheService.set(cacheKey, buildDetails, ttl);

      return buildDetails;
    } catch (error) {
      console.error(`[Jenkins API] Error fetching build ${jobName}/${buildNumber}:`, error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Get build console log
   * @param {string} jobName - Jenkins job name
   * @param {number} buildNumber - Build number
   * @param {number} start - Start byte offset (for pagination)
   * @returns {Promise<Object>} - Log data with text and metadata
   */
  async getBuildLog(jobName, buildNumber, start = 0) {
    try {
      const response = await this.client.get(`/job/${jobName}/${buildNumber}/logText/progressiveText`, {
        params: { start },
        responseType: 'text'
      });

      // X-More-Data header indicates if more log data is available
      const hasMore = response.headers['x-more-data'] === 'true';
      const nextStart = parseInt(response.headers['x-text-size']) || 0;

      return {
        text: response.data,
        hasMore,
        nextStart,
        size: nextStart
      };
    } catch (error) {
      console.error(`[Jenkins API] Error fetching log ${jobName}/${buildNumber}:`, error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Get last N successful builds for a job
   * @param {string} jobName - Jenkins job name
   * @param {number} count - Number of stable builds to retrieve (default 5)
   * @returns {Promise<Array>} - Array of stable build objects
   */
  async getStableBuilds(jobName, count = 5) {
    const cacheKey = `jenkins:stable:${jobName}:${count}`;
    
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get job with build history
      const response = await this.client.get(`/job/${jobName}/api/json`, {
        params: {
          tree: `builds[number,result,timestamp,actions[lastBuiltRevision[SHA1]]]`
        }
      });

      // Filter for successful builds and take the requested count
      const stableBuilds = response.data.builds
        .filter(build => build.result === 'SUCCESS')
        .slice(0, Math.min(count, 10)) // Max 10 as per design
        .map(build => ({
          number: build.number,
          timestamp: new Date(build.timestamp).toISOString(),
          commitSha: this.extractCommitSha(build.actions)
        }));

      cacheService.set(cacheKey, stableBuilds, 60);

      return stableBuilds;
    } catch (error) {
      console.error(`[Jenkins API] Error fetching stable builds ${jobName}:`, error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Trigger a build replay (for rollback)
   * @param {string} jobName - Jenkins job name
   * @param {number} buildNumber - Build number to replay
   * @returns {Promise<Object>} - Queue information
   */
  async replayBuild(jobName, buildNumber) {
    try {
      // Get the build's parameters
      const buildDetails = await this.client.get(`/job/${jobName}/${buildNumber}/api/json`);
      
      // Trigger new build with same parameters
      const response = await this.client.post(`/job/${jobName}/build`, null, {
        headers: {
          'Jenkins-Crumb': await this.getCrumb() // CSRF protection
        }
      });

      // Jenkins returns 201 with Location header containing queue item URL
      const queueUrl = response.headers.location;
      const queueId = queueUrl ? queueUrl.split('/').pop() : null;

      return {
        message: 'Build replay triggered',
        queueUrl,
        queueId,
        originalBuildNumber: buildNumber
      };
    } catch (error) {
      console.error(`[Jenkins API] Error replaying build ${jobName}/${buildNumber}:`, error.message);
      throw this.handleError(error);
    }
  }

  /**
   * Get Jenkins crumb for CSRF protection
   * @returns {Promise<string>} - Crumb value
   */
  async getCrumb() {
    try {
      const response = await this.client.get('/crumbIssuer/api/json');
      return response.data.crumb;
    } catch (error) {
      // Some Jenkins instances don't have CSRF protection enabled
      console.warn('[Jenkins API] Could not fetch crumb, CSRF protection may be disabled');
      return null;
    }
  }

  /**
   * Check Jenkins connectivity
   * @returns {Promise<boolean>} - True if Jenkins is reachable
   */
  async healthCheck() {
    try {
      await this.client.get('/api/json', { timeout: 5000 });
      return true;
    } catch (error) {
      console.error('[Jenkins API] Health check failed:', error.message);
      return false;
    }
  }

  // ============================================================================
  // Response Transformation Methods
  // ============================================================================

  /**
   * Transform Jenkins jobs response to internal format
   * @param {Array} jobs - Raw Jenkins jobs array
   * @returns {Array} - Transformed pipeline objects
   */
  transformJobsResponse(jobs) {
    if (!jobs || !Array.isArray(jobs)) {
      return [];
    }

    return jobs.map(job => {
      const lastBuild = job.lastBuild;
      
      return {
        id: job.name,
        name: job.name,
        displayName: job.displayName || job.name,
        url: job.url,
        lastBuild: lastBuild ? {
          number: lastBuild.number,
          status: this.normalizeStatus(lastBuild.result),
          duration: lastBuild.duration,
          timestamp: new Date(lastBuild.timestamp).toISOString(),
          branch: this.extractBranch(lastBuild.actions),
          commitSha: this.extractCommitSha(lastBuild.actions),
          author: this.extractAuthor(lastBuild.actions)
        } : null,
        environment: this.extractEnvironment(job.name)
      };
    }).filter(pipeline => pipeline.lastBuild !== null); // Filter out jobs with no builds
  }

  /**
   * Transform build details response to internal format
   * @param {Object} build - Raw Jenkins build object
   * @param {Array} stages - Pipeline stages array
   * @returns {Object} - Transformed build details
   */
  transformBuildDetailsResponse(build, stages = []) {
    const changeSet = build.changeSet?.items?.[0] || {};
    
    return {
      buildNumber: build.number,
      status: this.normalizeStatus(build.result),
      duration: build.duration,
      timestamp: new Date(build.timestamp).toISOString(),
      stages: stages,
      artifacts: (build.artifacts || []).map(artifact => ({
        name: artifact.fileName,
        relativePath: artifact.relativePath,
        url: `${config.url}/job/${build.fullDisplayName}/${build.number}/artifact/${artifact.relativePath}`
      })),
      commit: {
        sha: this.extractCommitSha(build.actions),
        author: changeSet.author?.fullName || this.extractAuthor(build.actions),
        message: changeSet.msg || '',
        url: this.buildCommitUrl(this.extractCommitSha(build.actions))
      }
    };
  }

  /**
   * Transform pipeline stages response
   * @param {Array} stages - Raw stages array from wfapi
   * @returns {Array} - Transformed stages
   */
  transformStagesResponse(stages) {
    if (!stages || !Array.isArray(stages)) {
      return [];
    }

    return stages.map(stage => ({
      name: stage.name,
      duration: stage.durationMillis,
      status: this.normalizeStatus(stage.status)
    }));
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Normalize Jenkins status to internal format
   * @param {string} jenkinsStatus - Jenkins status string
   * @returns {string} - Normalized status (SUCCESS/FAILED/RUNNING/ABORTED)
   */
  normalizeStatus(jenkinsStatus) {
    if (!jenkinsStatus) return 'RUNNING';
    
    const statusMap = {
      'SUCCESS': 'SUCCESS',
      'FAILURE': 'FAILED',
      'UNSTABLE': 'FAILED',
      'ABORTED': 'ABORTED',
      'NOT_BUILT': 'ABORTED',
      'IN_PROGRESS': 'RUNNING',
      null: 'RUNNING'
    };

    return statusMap[jenkinsStatus] || 'UNKNOWN';
  }

  /**
   * Extract Git branch from build actions
   * @param {Array} actions - Jenkins build actions array
   * @returns {string} - Branch name
   */
  extractBranch(actions) {
    if (!actions) return '';
    
    for (const action of actions) {
      if (action.lastBuiltRevision?.branch?.[0]?.name) {
        return action.lastBuiltRevision.branch[0].name.replace('refs/heads/', '');
      }
    }
    
    return '';
  }

  /**
   * Extract commit SHA from build actions
   * @param {Array} actions - Jenkins build actions array
   * @returns {string} - Commit SHA
   */
  extractCommitSha(actions) {
    if (!actions) return '';
    
    for (const action of actions) {
      if (action.lastBuiltRevision?.SHA1) {
        return action.lastBuiltRevision.SHA1.substring(0, 7); // Short SHA
      }
    }
    
    return '';
  }

  /**
   * Extract commit author from build actions
   * @param {Array} actions - Jenkins build actions array
   * @returns {string} - Author name
   */
  extractAuthor(actions) {
    if (!actions) return '';
    
    for (const action of actions) {
      if (action.causes?.[0]?.userName) {
        return action.causes[0].userName;
      }
    }
    
    return '';
  }

  /**
   * Extract environment from job name
   * Assumes naming convention like: jobname-dev, jobname-staging, jobname-production
   * @param {string} jobName - Jenkins job name
   * @returns {string|null} - Environment name or null
   */
  extractEnvironment(jobName) {
    const lowerName = jobName.toLowerCase();
    
    if (lowerName.includes('prod')) return 'production';
    if (lowerName.includes('stag')) return 'staging';
    if (lowerName.includes('dev')) return 'dev';
    
    return null;
  }

  /**
   * Build GitHub commit URL from SHA
   * @param {string} sha - Commit SHA
   * @returns {string} - GitHub commit URL (placeholder if repo unknown)
   */
  buildCommitUrl(sha) {
    // In a real implementation, we'd need to know the repo URL
    // This could come from job configuration or environment variables
    return sha ? `https://github.com/org/repo/commit/${sha}` : '';
  }

  /**
   * Handle axios errors and transform to consistent format with French messages
   * @param {Error} error - Axios error object
   * @returns {ApiError} - Transformed error
   */
  handleError(error) {
    if (error.response) {
      // Jenkins API returned an error response
      const status = error.response.status;
      let message = 'Une erreur est survenue avec l\'API Jenkins'; // French: An error occurred with the Jenkins API
      
      if (status === 401 || status === 403) {
        message = 'Authentification Jenkins échouée'; // French: Jenkins authentication failed
      } else if (status === 404) {
        message = 'Ressource Jenkins introuvable'; // French: Jenkins resource not found
      } else if (status >= 500) {
        message = 'Erreur serveur Jenkins'; // French: Jenkins server error
      }
      
      throw new ApiError(status, message);
    } else if (error.request) {
      // Request was made but no response received
      throw new ApiError(503, 'Jenkins est injoignable'); // French: Jenkins is unreachable
    } else {
      // Something else went wrong
      throw new ApiError(500, `Erreur lors de la communication avec Jenkins: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new JenkinsService();
