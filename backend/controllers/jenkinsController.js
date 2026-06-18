const jenkinsService = require('../services/jenkinsService');
const sonarQubeService = require('../services/sonarQubeService');
const slackService = require('../services/slackService');
const demo = require('../services/demoService');
const ApiError = require('../utils/ApiError');

/**
 * Contrôleur Jenkins
 * Gère les requêtes HTTP pour les endpoints proxy Jenkins
 * Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.6, 6.2
 */

/**
 * Enrichit les pipelines avec les métriques SonarQube correspondantes.
 * La clé de projet Sonar est supposée identique au nom du job Jenkins.
 * Résilient : un échec (projet absent, Sonar indisponible) n'attache rien.
 */
const enrichWithSonar = async (pipelines) => {
  const results = await Promise.allSettled(
    pipelines.map((p) => sonarQubeService.getProjectMetrics(p.name))
  );
  return pipelines.map((p, i) => {
    const r = results[i];
    if (r.status === 'fulfilled' && r.value && r.value.available !== false) {
      return { ...p, qualityMetrics: r.value };
    }
    return p;
  });
};

/**
 * GET /api/jenkins/pipelines
 * Récupère tous les pipelines Jenkins, avec filtre optionnel par environnement,
 * enrichis des métriques SonarQube quand elles existent.
 */
const getAllPipelines = async (req, res, next) => {
  try {
    const { environment } = req.query;
    if (demo.isDemo()) {
      return res.status(200).json({ status: 'success', data: { pipelines: demo.getPipelines(environment) } });
    }
    const pipelines = await jenkinsService.getAllJobs(environment || null);
    const enriched = await enrichWithSonar(pipelines);
    res.status(200).json({
      status: 'success',
      data: { pipelines: enriched },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/jenkins/build/:jobName/:buildNumber
 * Récupère les détails d'un build spécifique
 */
const getBuildDetails = async (req, res, next) => {
  try {
    const { jobName, buildNumber } = req.params;
    const num = parseInt(buildNumber, 10);
    if (Number.isNaN(num) || num < 1) {
      throw new ApiError(400, 'Numéro de build invalide');
    }
    if (demo.isDemo()) {
      return res.status(200).json({ status: 'success', data: demo.getBuildDetails(jobName, num) });
    }
    const build = await jenkinsService.getBuildDetails(jobName, num);
    res.status(200).json({ status: 'success', data: build });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/jenkins/build/:jobName/:buildNumber/log
 * Récupère le log console d'un build avec pagination (1000 lignes par page)
 */
const getBuildLog = async (req, res, next) => {
  try {
    const { jobName, buildNumber } = req.params;
    const num = parseInt(buildNumber, 10);
    if (Number.isNaN(num) || num < 1) {
      throw new ApiError(400, 'Numéro de build invalide');
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 1000, 5000);

    const logData = demo.isDemo() ? demo.buildLog() : await jenkinsService.getBuildLog(jobName, num);
    const lines = (logData.text || '').split('\n');
    const totalLines = lines.length;
    const totalPages = Math.max(Math.ceil(totalLines / pageSize), 1);
    const startIdx = (page - 1) * pageSize;
    const pageLines = lines.slice(startIdx, startIdx + pageSize);

    res.status(200).json({
      status: 'success',
      data: {
        log: pageLines,
        pagination: { currentPage: page, totalPages, totalLines },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/jenkins/build/:jobName/:buildNumber/replay
 * Déclenche un replay de build (pour le rollback)
 */
const triggerBuild = async (req, res, next) => {
  try {
    const { jobName, buildNumber } = req.params;
    const num = parseInt(buildNumber, 10);
    if (Number.isNaN(num) || num < 1) {
      throw new ApiError(400, 'Numéro de build invalide');
    }
    if (demo.isDemo()) {
      return res.status(201).json({ status: 'success', data: { message: 'Rollback simulé (mode démo)', queuedBuildNumber: num + 1 } });
    }
    const result = await jenkinsService.replayBuild(jobName, num);
    // Notification Slack du rollback (Req 15.4) — n'échoue jamais le traitement
    slackService.notifyRollback(jobName, num).catch(() => {});
    res.status(201).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/jenkins/builds/:jobName/stable
 * Retourne les N derniers builds réussis (pour le rollback)
 */
const getStableBuilds = async (req, res, next) => {
  try {
    const { jobName } = req.params;
    const count = Math.min(parseInt(req.query.count, 10) || 5, 10);
    if (demo.isDemo()) {
      return res.status(200).json({ status: 'success', data: { builds: demo.getStableBuilds(jobName, count) } });
    }
    const builds = await jenkinsService.getStableBuilds(jobName, count);
    res.status(200).json({ status: 'success', data: { builds } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllPipelines,
  getBuildDetails,
  getBuildLog,
  triggerBuild,
  getStableBuilds,
};
