const jwt = require('jsonwebtoken');
const config = require('../config/auth');
const ApiError = require('../utils/ApiError');

/**
 * Middleware d'authentification JWT.
 * Vérifie l'en-tête Authorization: Bearer <token> et attache req.user.
 */
const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new ApiError(401, 'Authentification requise');
    }

    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { username: payload.sub };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Session expirée, veuillez vous reconnecter'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Token invalide'));
    }
    next(err);
  }
};

module.exports = requireAuth;
