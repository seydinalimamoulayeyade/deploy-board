const express = require('express');
const router = express.Router();
const sonarQubeController = require('../controllers/sonarQubeController');

/**
 * Routes SonarQube
 * Requirements: 4.1
 */
router.get('/metrics/:projectKey', sonarQubeController.getProjectMetrics);
router.get('/quality-gate/:projectKey', sonarQubeController.getQualityGateStatus);

module.exports = router;
