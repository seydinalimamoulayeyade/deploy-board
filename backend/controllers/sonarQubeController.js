const sonarQubeService = require('../services/sonarQubeService');

/**
 * Contrôleur SonarQube
 * Requirements: 4.1-4.7
 */

/**
 * GET /api/sonarqube/metrics/:projectKey
 * Récupère les métriques de qualité d'un projet.
 * En cas d'indisponibilité de SonarQube, retourne un statut "Indisponible" (Req 13.2)
 */
const getProjectMetrics = async (req, res, next) => {
  try {
    const { projectKey } = req.params;
    const metrics = await sonarQubeService.getProjectMetrics(projectKey);
    res.status(200).json({ status: 'success', data: metrics });
  } catch (err) {
    // Dégradation gracieuse : SonarQube indisponible (Req 13.2)
    if (err.statusCode === 503) {
      return res.status(200).json({
        status: 'success',
        data: { projectKey: req.params.projectKey, available: false, message: 'Indisponible' },
      });
    }
    next(err);
  }
};

const getQualityGateStatus = async (req, res, next) => {
  try {
    const { projectKey } = req.params;
    const status = await sonarQubeService.getQualityGateStatus(projectKey);
    res.status(200).json({ status: 'success', data: { projectKey, qualityGateStatus: status } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjectMetrics, getQualityGateStatus };
