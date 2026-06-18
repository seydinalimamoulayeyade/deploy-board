const sonarQubeService = require('../services/sonarQubeService');
const demo = require('../services/demoService');

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
    if (demo.isDemo()) {
      return res.status(200).json({ status: 'success', data: demo.getSonarMetrics(projectKey) });
    }
    const metrics = await sonarQubeService.getProjectMetrics(projectKey);
    res.status(200).json({ status: 'success', data: metrics });
  } catch (err) {
    // Dégradation gracieuse : SonarQube indisponible ou permission insuffisante (Req 13.2)
    if ([503, 401, 403].includes(err.statusCode)) {
      return res.status(200).json({
        status: 'success',
        data: {
          projectKey: req.params.projectKey,
          available: false,
          message: 'Indisponible',
          reason: err.message,
        },
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
