const config = {
  url:   process.env.SONARQUBE_URL   || 'http://localhost:9000',
  token: process.env.SONARQUBE_TOKEN || '',
};

if (!config.token) {
  console.warn('⚠️  SONARQUBE_TOKEN non défini');
}

// SonarQube utilise une authentification Basic avec le token comme username (mot de passe vide)
config.authHeader = `Basic ${Buffer.from(`${config.token}:`).toString('base64')}`;

module.exports = config;
