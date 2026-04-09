const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────────
const authRoutes     = require('./routes/authRoutes');
const itemRoutes     = require('./routes/itemRoutes');
const issueRoutes    = require('./routes/issueRoutes');
const logRoutes      = require('./routes/logRoutes');

app.use('/api/auth',      authRoutes);
app.use('/api/items',     itemRoutes);
app.use('/api/issues',    issueRoutes);
app.use('/api/logs',      logRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Global error handler ─────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', messages });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({ error: `Duplicate value for "${field}"` });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// ── Database & Server ────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/storeMgmtSys';

// Enable Mongoose debug mode in development or if specifically requested
if (process.env.DB_DEBUG === 'true') {
  mongoose.set('debug', true);
}

// Global connection event listeners for better debugging
mongoose.connection.on('connected', () => {
  console.log('🔗  Mongoose connected to database successfully.');
});
mongoose.connection.on('error', (err) => {
  console.error('⚠️  Mongoose connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.warn('🔌  Mongoose disconnected from database.');
});
mongoose.connection.on('reconnected', () => {
  console.log('🔄  Mongoose reconnected to database.');
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB initial connection established.');
    app.listen(PORT, () => {
      console.log(`🚀  Server running on http://localhost:${PORT} or https://tsl-storemgmtsys.onrender.com`);
    });
  })
  .catch((err) => {
    console.error('❌  MongoDB initial connection failed:', err);
    process.exit(1);
  });

module.exports = app;
