import axios from 'axios'

const TOKEN_KEY = 'deployboard_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

/**
 * Client API centralisé.
 * Toutes les requêtes passent par le backend (proxy).
 */
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 35000,
  headers: { 'Content-Type': 'application/json' },
})

// Ajoute le JWT à chaque requête
apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Déconnexion automatique sur 401 (token absent/expiré)
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      clearToken()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ----- Auth -----
export const authApi = {
  login: (username, password) => apiClient.post('/auth/login', { username, password }),
  guest: () => apiClient.post('/auth/guest'),
  me: () => apiClient.get('/auth/me'),
}

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

// ----- Santé des services (endpoint racine /health, hors /api) -----
export const healthApi = {
  get: () => axios.get('/health', { timeout: 10000 }),
}

export default apiClient
