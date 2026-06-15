const express = require('express');
const router = express.Router();
const deploymentsController = require('../controllers/deploymentsController');

/**
 * Routes Historique de déploiement
 * Requirements: 5.1, 7.1, 7.3, 7.4, 7.5
 */
router.get('/history/:pipelineId', deploymentsController.getDeploymentHistory);
router.post('/', deploymentsController.saveDeployment);
router.get('/environments/:environment/status', deploymentsController.getEnvironmentStatus);

module.exports = router;
