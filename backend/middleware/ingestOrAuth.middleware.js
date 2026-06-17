const jwt = require('jsonwebtoken');
const config = require('../config/auth');
const ApiError = require('../utils/ApiError');

/**
 * Autorise l'accès si :
 *  - un JWT utilisateur valide est présent (dashboard), OU
 *  - l'en-tête x-deploy-token correspond à DEPLOY_INGEST_TOKEN (Jenkins/CI).
 * Utilisé pour l'enregistrement des déploiements appelé par le pipeline.
 */
const ingestToken = process.env.DEPLOY_INGEST_TOKEN || '';

const ingestOrAuth = (req, res, next) => {
  // 1) Token d'ingestion machine (CI)
  const provided = req.headers['x-deploy-token'];
  if (ingestToken && provided && provided === ingestToken) {
    req.user = { username: 'ci-pipeline' };
    return next();
  }

  // 2) JWT utilisateur
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      req.user = { username: payload.sub };
      return next();
    } catch {
      return next(new ApiError(401, 'Token invalide ou expiré'));
    }
  }

  return next(new ApiError(401, 'Authentification requise'));
};

module.exports = ingestOrAuth;
