import express from 'express';
import { createServer } from 'http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { config } from './config/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import swipeRoutes from './routes/swipes.js';
import matchRoutes from './routes/matches.js';
import reportRoutes from './routes/reports.js';
import { setupSocket } from './socket/index.js';

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));
// 10mb limit: photo uploads arrive as base64 data URLs via JSON.
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swipes', swipeRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Single-service production deployment (e.g. Render): serve the built Vite
// client from the same origin so /api + Socket.IO need no extra config.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');
if (config.nodeEnv === 'production' && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

mongoose.connect(config.mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

setupSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

export { app, httpServer };