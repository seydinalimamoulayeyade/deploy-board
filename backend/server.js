require('dotenv').config();
const app = require('./app');
const { initializeDatabase } = require('./config/mongodb');

const PORT = process.env.PORT || 5001;

const start = async () => {
  try {
    // Initialize MongoDB with retry logic
    await initializeDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Deploy Board running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err.message);
    process.exit(1);
  }
};

start();