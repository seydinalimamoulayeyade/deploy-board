const mongoose = require('mongoose');

/**
 * MongoDB connection configuration with retry logic
 * Implements Requirements 5.1, 5.2, 13.6
 */

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

/**
 * Connect to MongoDB with automatic retry logic
 * @param {number} retryCount - Current retry attempt number
 * @returns {Promise<void>}
 */
const connectWithRetry = async (retryCount = 0) => {
  try {
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('✅ MongoDB connecté avec succès');
    console.log(`   Base de données: ${mongoose.connection.name}`);
    console.log(`   Hôte: ${mongoose.connection.host}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error(`❌ Échec de la tentative de connexion MongoDB ${retryCount + 1}:`, error.message);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`⏳ Nouvelle tentative dans ${RETRY_INTERVAL / 1000} secondes... (${retryCount + 1}/${MAX_RETRIES})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      
      // Retry connection
      return connectWithRetry(retryCount + 1);
    } else {
      console.error(`❌ Échec de connexion à MongoDB après ${MAX_RETRIES} tentatives`);
      throw error;
    }
  }
};

/**
 * Setup MongoDB connection event handlers
 */
const setupConnectionHandlers = () => {
  // Connection events
  mongoose.connection.on('connected', () => {
    console.log('📡 Connexion MongoDB établie');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB déconnecté');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('🛑 Connexion MongoDB fermée suite à l\'arrêt de l\'application');
      process.exit(0);
    } catch (err) {
      console.error('❌ Erreur lors de la fermeture de la connexion MongoDB:', err.message);
      process.exit(1);
    }
  });
};

/**
 * Initialize MongoDB connection with retry logic and event handlers
 * @returns {Promise<mongoose.Connection>}
 */
const initializeDatabase = async () => {
  setupConnectionHandlers();
  return connectWithRetry();
};

/**
 * Check if MongoDB connection is active
 * @returns {boolean}
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get connection status string
 * @returns {string}
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = {
  connectWithRetry,
  initializeDatabase,
  setupConnectionHandlers,
  isConnected,
  getConnectionStatus,
};
