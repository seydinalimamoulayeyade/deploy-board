const axios = require('axios');
const config = require('../config/sonarqube');
const cacheService = require('./cacheService');
const ApiError = require('../utils/ApiError');

/**
 * Service SonarQube
 * Gère la communication avec l'API SonarQube (métriques de qualité)
 * Requirements: 4.1-4.7, 10.2, 10.4, 13.2
 */
class SonarQubeService {
  constructor() {
    this.client = axios.create({
      baseURL: config.url,
      timeout: 30000,
      headers: { Authorization: config.authHeader },
    });

    // Retry une fois sur erreur réseau / timeout
    this.client.interceptors.response.use(null, async (error) => {
      const original = error.config;
      if (original && !original._retry &&
          ['ECONNABORTED', 'ETIMEDOUT', 'ECONNREFUSED'].includes(error.code)) {
        original._retry = true;
        return this.client.request(original);
      }
      throw error;
    });
  }

  /**
   * Récupère les métriques de qualité d'un projet
   * @param {string} projectKey - Clé du projet SonarQube
   */
  async getProjectMetrics(projectKey) {
    const cacheKey = `sonar:metrics:${projectKey}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const metricKeys = 'bugs,code_smells,coverage,reliability_rating,sqale_rating,vulnerabilities';
      const response = await this.client.get('/api/measures/component', {
        params: { component: projectKey, metricKeys },
      });

      const gateStatus = await this.getQualityGateStatus(projectKey);
      const metrics = this.transformMetrics(response.data, projectKey, gateStatus);

      cacheService.set(cacheKey, metrics, 60);
      return metrics;
    } catch (err) {
      console.error(`[SonarQube] Erreur métriques ${projectKey}:`, err.message);
      throw this.handleError(err);
    }
  }

  /**
   * Récupère le statut du Quality Gate d'un projet
   */
  async getQualityGateStatus(projectKey) {
    try {
      const response = await this.client.get('/api/qualitygates/project_status', {
        params: { projectKey },
      });
      return response.data.projectStatus?.status || 'NONE';
    } catch (err) {
      console.warn(`[SonarQube] Quality gate indisponible pour ${projectKey}`);
      return 'NONE';
    }
  }

  /**
   * Transforme la réponse SonarQube en format interne
   */
  transformMetrics(data, projectKey, qualityGateStatus) {
    const measures = {};
    (data.component?.measures || []).forEach((m) => {
      measures[m.metric] = m.value;
    });

    const ratingMap = { '1.0': 'A', '2.0': 'B', '3.0': 'C', '4.0': 'D', '5.0': 'E' };

    return {
      projectKey,
      rating: ratingMap[measures.sqale_rating] || 'A',
      bugs: parseInt(measures.bugs, 10) || 0,
      codeSmells: parseInt(measures.code_smells, 10) || 0,
      vulnerabilities: parseInt(measures.vulnerabilities, 10) || 0,
      coverage: measures.coverage !== undefined ? parseFloat(measures.coverage) : null,
      qualityGateStatus: qualityGateStatus === 'OK' ? 'PASSED'
        : qualityGateStatus === 'ERROR' ? 'FAILED' : 'NONE',
      trends: this.calculateTrends(projectKey, {
        bugs: parseInt(measures.bugs, 10) || 0,
        codeSmells: parseInt(measures.code_smells, 10) || 0,
        coverage: measures.coverage !== undefined ? parseFloat(measures.coverage) : 0,
      }),
    };
  }

  /**
   * Calcule la tendance en comparant avec la mesure précédente mise en cache
   */
  calculateTrends(projectKey, current) {
    const prevKey = `sonar:prev:${projectKey}`;
    const previous = cacheService.get(prevKey);
    cacheService.set(prevKey, current, 3600);

    if (!previous) {
      return { bugs: 0, codeSmells: 0, coverage: 0 };
    }
    return {
      bugs: current.bugs - previous.bugs,
      codeSmells: current.codeSmells - previous.codeSmells,
      coverage: parseFloat((current.coverage - previous.coverage).toFixed(2)),
    };
  }

  async healthCheck() {
    try {
      await this.client.get('/api/system/status', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  handleError(error) {
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        return new ApiError(status, 'Authentification SonarQube échouée');
      }
      if (status === 404) {
        return new ApiError(404, 'Projet SonarQube introuvable');
      }
      return new ApiError(status, 'Erreur de l\'API SonarQube');
    }
    if (error.request) {
      return new ApiError(503, 'SonarQube est injoignable');
    }
    return new ApiError(500, `Erreur SonarQube: ${error.message}`);
  }
}

module.exports = new SonarQubeService();
