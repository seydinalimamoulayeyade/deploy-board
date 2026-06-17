const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/auth.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');

// Connexion (limitée contre le bruteforce)
router.post('/login', loginLimiter, authController.login);

// Utilisateur courant (protégé)
router.get('/me', requireAuth, authController.me);

module.exports = router;
