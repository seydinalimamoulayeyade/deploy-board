const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/auth');
const ApiError = require('../utils/ApiError');

/**
 * Vérifie le mot de passe admin (hash bcrypt prioritaire, sinon clair).
 */
const verifyAdminPassword = async (password) => {
  if (config.passwordHash) {
    return bcrypt.compare(password, config.passwordHash);
  }
  if (config.password) {
    return password === config.password;
  }
  return false;
};

/**
 * Génère un JWT incluant le rôle.
 */
const signToken = (username, role) =>
  jwt.sign({ sub: username, role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

/**
 * POST /api/auth/login
 * Connexion admin (rôle "admin").
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      throw new ApiError(400, 'Identifiant et mot de passe requis');
    }

    const ok = username === config.username && (await verifyAdminPassword(password));
    if (!ok) {
      throw new ApiError(401, 'Identifiants invalides');
    }

    const token = signToken(username, 'admin');
    res.status(200).json({
      status: 'success',
      data: { token, user: { username, role: 'admin' } },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/guest
 * Ouvre une session invité en lecture seule (rôle "viewer"), sans mot de passe.
 */
const guest = (req, res, next) => {
  try {
    if (!config.guestEnabled) {
      throw new ApiError(403, 'Accès invité désactivé');
    }
    const token = signToken(config.guestUsername, 'viewer');
    res.status(200).json({
      status: 'success',
      data: { token, user: { username: config.guestUsername, role: 'viewer' } },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Utilisateur courant (route protégée).
 */
const me = (req, res) => {
  res.status(200).json({ status: 'success', data: { user: req.user } });
};

module.exports = { login, guest, me };
