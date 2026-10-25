const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/appError');
const env = require('./config/env');

const app = express();

// Security HTTP headers
app.use(helmet());

// Generated TTS audio (Tier 1 Kokoro batch / Tier 2 edge-tts fallback).
// cross-origin resource policy is required: the SPA on clientUrl loads
// /audio/*.mp3 directly from this origin inside <audio> elements.
app.use(
  '/audio',
  helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }),
  express.static(path.resolve(__dirname, '../public/audio'), {
    maxAge: '7d',
    fallthrough: false,
  }),
);

// CORS Configuration
app.use(cors({
  origin: env.clientUrl,
  credentials: true
}));

// Body Parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// API Root Route
app.get('/', (req, res) => {
  res.json({
    name: 'IELTS Adaptive Learning Engine Backend',
    version: '1.0.0',
    documentation: '/api/v1/health'
  });
});

// Mount API v1 routes
app.use('/api/v1', routes);

// Handle Unhandled Routes (404)
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find route ${req.originalUrl} on this server`, 404, 'ROUTE_NOT_FOUND'));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
