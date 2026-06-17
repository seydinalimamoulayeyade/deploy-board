/**
 * Configuration de l'authentification (admin unique + JWT).
 * - ADMIN_USERNAME / ADMIN_PASSWORD (ou ADMIN_PASSWORD_HASH bcrypt) dans .env
 * - JWT_SECRET pour signer les tokens
 */
const config = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || '',
  passwordHash: process.env.ADMIN_PASSWORD_HASH || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
};

if (!config.jwtSecret) {
  console.warn('⚠️  JWT_SECRET non défini — utilisation d\'un secret de développement (à NE PAS utiliser en production)');
  config.jwtSecret = 'dev-secret-change-me';
}

if (!config.password && !config.passwordHash) {
  console.warn('⚠️  ADMIN_PASSWORD / ADMIN_PASSWORD_HASH non défini — l\'authentification refusera toute connexion');
}

module.exports = config;
