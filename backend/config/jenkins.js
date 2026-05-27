const config = {
  url:   process.env.JENKINS_URL   || 'http://localhost:8080',
  user:  process.env.JENKINS_USER  || '',
  token: process.env.JENKINS_TOKEN || '',
};

if (!config.user || !config.token) {
  console.warn('⚠️  JENKINS_USER or JENKINS_TOKEN not set');
}

// Axios auth header : Basic base64(user:token)
config.authHeader = `Basic ${Buffer.from(`${config.user}:${config.token}`).toString('base64')}`;

module.exports = config;