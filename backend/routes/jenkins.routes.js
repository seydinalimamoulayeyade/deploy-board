const express = require('express');
const router = express.Router();
const jenkinsController = require('../controllers/jenkinsController');

/**
 * Routes Jenkins
 * Requirements: 1.1, 3.1, 6.1, 6.4
 */

// Liste de tous les pipelines
router.get('/pipelines', jenkinsController.getAllPipelines);

// Détails d'un build
router.get('/build/:jobName/:buildNumber', jenkinsController.getBuildDetails);

// Log console d'un build (paginé)
router.get('/build/:jobName/:buildNumber/log', jenkinsController.getBuildLog);

// Replay d'un build (rollback)
router.post('/build/:jobName/:buildNumber/replay', jenkinsController.triggerBuild);

// Derniers builds stables (réussis)
router.get('/builds/:jobName/stable', jenkinsController.getStableBuilds);

module.exports = router;
