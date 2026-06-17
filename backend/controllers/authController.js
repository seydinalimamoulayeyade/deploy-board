const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config/auth');
const ApiError = require('../utils/ApiError');

/**
 * Vérifie le mot de passe fourni contre la config (hash bcrypt prioritaire,
 * sinon comparaison en clair via ADMIN_PASSWORD).
 */
const verifyPassword = async (password) => {
  if (config.passwordHash) {
    return bcrypt.compare(password, config.passwordHash);
  }
  if (config.password) {
    return password === config.password;
  }
  return false;
};

/**
 * POST /api/auth/login
 * Vérifie les identifiants admin et retourne un JWT.
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      throw new ApiError(400, 'Identifiant et mot de passe requis');
    }

    const userOk = username === config.username;
    const passOk = await verifyPassword(password);

    if (!userOk || !passOk) {
      throw new ApiError(401, 'Identifiants invalides');
    }

    const token = jwt.sign({ sub: username }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    res.status(200).json({
      status: 'success',
      data: { token, user: { username } },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Retourne l'utilisateur courant (route protégée).
 */
const me = (req, res) => {
  res.status(200).json({ status: 'success', data: { user: req.user } });
};

module.exports = { login, me };
