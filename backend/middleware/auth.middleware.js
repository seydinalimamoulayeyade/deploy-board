const jwt = require('jsonwebtoken');
const config = require('../config/auth');
const ApiError = require('../utils/ApiError');

/**
 * Vérifie le JWT et attache req.user = { username, role }.
 */
const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      throw new ApiError(401, 'Authentification requise');
    }

    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { username: payload.sub, role: payload.role || 'viewer' };
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

/**
 * Exige le rôle "admin" (actions sensibles : rollback, etc.).
 * À utiliser après requireAuth.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new ApiError(403, 'Action réservée à l\'administrateur (mode lecture seule)'));
  }
  next();
};

module.exports = requireAuth;
module.exports.requireAdmin = requireAdmin;
