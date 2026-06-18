/**
 * Configuration de l'authentification.
 * - Compte admin (rôle "admin") : accès complet, peut déclencher des rollbacks
 * - Compte invité (rôle "viewer") : lecture seule, pour la démo publique
 * - JWT pour signer les tokens
 */
const config = {
  // Admin
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || '',
  passwordHash: process.env.ADMIN_PASSWORD_HASH || '',

  // Invité (démo lecture seule) — activé par défaut
  guestEnabled: process.env.GUEST_ENABLED !== 'false',
  guestUsername: process.env.GUEST_USERNAME || 'invite',

  // JWT
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
};

if (!config.jwtSecret) {
  console.warn('⚠️  JWT_SECRET non défini — secret de développement utilisé (NE PAS utiliser en production)');
  config.jwtSecret = 'dev-secret-change-me';
}

if (!config.password && !config.passwordHash) {
  console.warn('⚠️  ADMIN_PASSWORD / ADMIN_PASSWORD_HASH non défini — la connexion admin sera refusée');
}

module.exports = config;
