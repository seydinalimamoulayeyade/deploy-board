import axios from 'axios'

/**
 * Client API centralisé
 * Toutes les requêtes passent par le backend (proxy) — Req 10.5
 */
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
})

// ----- Jenkins -----
export const jenkinsApi = {
  getPipelines: (environment) =>
    apiClient.get('/jenkins/pipelines', { params: environment ? { environment } : {} }),
  getBuildDetails: (jobName, buildNumber) =>
    apiClient.get(`/jenkins/build/${jobName}/${buildNumber}`),
  getBuildLog: (jobName, buildNumber, page = 1, pageSize = 1000) =>
    apiClient.get(`/jenkins/build/${jobName}/${buildNumber}/log`, { params: { page, pageSize } }),
  replayBuild: (jobName, buildNumber) =>
    apiClient.post(`/jenkins/build/${jobName}/${buildNumber}/replay`),
  getStableBuilds: (jobName, count = 5) =>
    apiClient.get(`/jenkins/builds/${jobName}/stable`, { params: { count } }),
}

// ----- SonarQube -----
export const sonarApi = {
  getMetrics: (projectKey) => apiClient.get(`/sonarqube/metrics/${projectKey}`),
}

// ----- Déploiements -----
export const deploymentsApi = {
  getHistory: (pipelineId, params = {}) =>
    apiClient.get(`/deployments/history/${pipelineId}`, { params }),
  getEnvironmentStatus: (environment) =>
    apiClient.get(`/deployments/environments/${environment}/status`),
}

export default apiClient
