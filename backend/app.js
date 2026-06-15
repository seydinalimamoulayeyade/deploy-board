const express    = require('express');
const cors       = require('cors');
const compression = require('compression');
const path       = require('path');
const errorHandler       = require('./middleware/error.middleware');
const jenkinsRoutes      = require('./routes/jenkins.routes');
const sonarqubeRoutes    = require('./routes/sonarqube.routes');
const deploymentsRoutes  = require('./routes/deployments.routes');
const { getConnectionStatus } = require('./config/mongodb');
const jenkinsService = require('./services/jenkinsService');
const sonarQubeService = require('./services/sonarQubeService');

const app = express();

app.use(compression()); // Compression gzip des réponses (Req 14.2)
app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/jenkins',     jenkinsRoutes);
app.use('/api/sonarqube',   sonarqubeRoutes);
app.use('/api/deployments', deploymentsRoutes);

// Health check avec connectivité des services (Req 12.6)
app.get('/health', async (req, res) => {
  const [jenkins, sonarqube] = await Promise.all([
    jenkinsService.healthCheck().catch(() => false),
    sonarQubeService.healthCheck().catch(() => false),
  ]);

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: getConnectionStatus(),
      jenkins: jenkins ? 'reachable' : 'unreachable',
      sonarqube: sonarqube ? 'reachable' : 'unreachable',
    },
  });
});

// Fichiers statiques React (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

app.use(errorHandler);

module.exports = app;
