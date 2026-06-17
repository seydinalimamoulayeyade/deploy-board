const express = require('express');
const router = express.Router();
const deploymentsController = require('../controllers/deploymentsController');
const requireAuth = require('../middleware/auth.middleware');
const ingestOrAuth = require('../middleware/ingestOrAuth.middleware');

/**
 * Routes Historique de déploiement
 * - Lecture : JWT utilisateur requis (dashboard)
 * - Enregistrement (POST) : JWT OU token d'ingestion CI (Jenkins)
 */
router.get('/history/:pipelineId', requireAuth, deploymentsController.getDeploymentHistory);
router.post('/', ingestOrAuth, deploymentsController.saveDeployment);
router.get('/environments/:environment/status', requireAuth, deploymentsController.getEnvironmentStatus);

module.exports = router;
