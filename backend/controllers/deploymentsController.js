const Deployment = require('../models/Deployment');
const slackService = require('../services/slackService');
const ApiError = require('../utils/ApiError');

/**
 * Contrôleur Historique de déploiement
 * Requirements: 5.1-5.6, 7.1, 7.3, 7.4, 7.5, 14.4
 */

/**
 * GET /api/deployments/history/:pipelineId
 * Historique des déploiements avec pagination (max 50) et filtre par statut
 */
const getDeploymentHistory = async (req, res, next) => {
  try {
    const { pipelineId } = req.params;
    const days = Math.max(parseInt(req.query.days, 10) || 7, 1);
    const status = req.query.status || null;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 50, 50);

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const query = { pipelineId, timestamp: { $gte: startDate } };
    if (status) query.status = status;

    const totalItems = await Deployment.countDocuments(query);
    const builds = await Deployment.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const stats = await Deployment.getDeploymentStats(pipelineId, days);

    res.status(200).json({
      status: 'success',
      data: {
        builds,
        stats,
        pagination: {
          currentPage: page,
          totalPages: Math.max(Math.ceil(totalItems / pageSize), 1),
          totalItems,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/deployments
 * Enregistre un événement de déploiement (appelé par le pipeline Jenkins)
 */
const saveDeployment = async (req, res, next) => {
  try {
    const { pipelineId, buildNumber, status, environment } = req.body || {};
    if (!pipelineId || !buildNumber || !status || !environment) {
      throw new ApiError(400, 'Champs requis manquants : pipelineId, buildNumber, status, environment');
    }

    const deployment = await Deployment.create(req.body);

    // Notifications Slack selon le statut (Req 15.1, 15.2, 15.3)
    if (status === 'FAILED') {
      slackService.notifyBuildFailure(pipelineId, buildNumber, req.body.failureReason).catch(() => {});
    } else if (status === 'SUCCESS') {
      // Vérifie si le build précédent avait échoué -> notification de récupération
      const previous = await Deployment.findOne({ pipelineId, buildNumber: { $lt: buildNumber } })
        .sort({ buildNumber: -1 }).lean().catch(() => null);
      if (previous && previous.status === 'FAILED') {
        slackService.notifyBuildRecovery(pipelineId, buildNumber).catch(() => {});
      }
    }

    res.status(201).json({
      status: 'success',
      data: { deploymentId: deployment._id, message: 'Déploiement enregistré' },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/deployments/environments/:environment/status
 * Statut de déploiement courant pour un environnement
 */
const getEnvironmentStatus = async (req, res, next) => {
  try {
    const { environment } = req.params;
    const deployments = await Deployment.getEnvironmentStatus(environment);
    res.status(200).json({
      status: 'success',
      data: { environment, deployments },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDeploymentHistory, saveDeployment, getEnvironmentStatus };
