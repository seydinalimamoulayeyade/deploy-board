const express    = require('express');
const cors       = require('cors');
const path       = require('path');
const errorHandler       = require('./middleware/error.middleware');
const jenkinsRoutes      = require('./routes/jenkins.routes');
const deploymentsRoutes  = require('./routes/deployments.routes');

const app = express();

app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/jenkins',     jenkinsRoutes);
app.use('/api/deployments', deploymentsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Fichiers statiques React (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

app.use(errorHandler);

module.exports = app;