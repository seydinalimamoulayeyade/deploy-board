const rateLimit = require('express-rate-limit');

/**
 * Limiteur global pour l'API (protège Jenkins/SonarQube d'un excès de requêtes).
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,            // 300 requêtes/min/IP (large : polling 10s + plusieurs onglets)
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Trop de requêtes, veuillez réessayer plus tard' },
});

/**
 * Limiteur strict pour la connexion (anti-bruteforce).
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // 10 tentatives / 15 min / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'fail', message: 'Trop de tentatives de connexion, réessayez dans 15 minutes' },
});

module.exports = { apiLimiter, loginLimiter };
