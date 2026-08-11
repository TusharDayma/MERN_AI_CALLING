import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import authRoutes from './src/modules/auth/auth.route.js';
import adminRoutes from './src/modules/admin/admin.route.js';
import campaignRoutes from './src/modules/campaigns/campaign.route.js';
import candidateRoutes from './src/modules/candidates/candidate.route.js';
import telephonyRoutes from './src/modules/telephony/telephony.route.js';
import twilioRoutes from './src/modules/twilio/twilio.route.js';
import webhookRoutes from './src/modules/webhooks/webhook.route.js';
import { initIO } from './src/modules/socket/socketManager.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Create WebSocket Proxy for Twilio Media Stream -> Python FastAPI AI Service (Port 8000)
const wsProxy = createProxyMiddleware({
  target: 'ws://127.0.0.1:8000',
  ws: true,
  changeOrigin: true
});

app.use('/media-stream', wsProxy);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Domain Routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes.' }
});

const launchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { error: 'Campaign launch limit exceeded for this IP.' }
});

app.use('/api/auth/signin', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/hr/campaigns/:id/launch', launchLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hr/campaigns', campaignRoutes);
app.use('/api/hr/candidates', candidateRoutes);
app.use('/api/hr', campaignRoutes); // Maintains backwards compatibility for /metrics and /job-roles
app.use('/api/telephony', telephonyRoutes); // Exotel telephony domain (WhatsApp + Voice)
app.use('/api/twilio', twilioRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'AntiTalk Domain-Driven API is running' });
});

// AI Engine Webhook Endpoint
app.use('/api/webhooks', webhookRoutes);

// Create HTTP server and bind WebSocket upgrade handler
const server = http.createServer(app);

server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/media-stream')) {
    wsProxy.upgrade(req, socket, head);
  }
});

// ─── Socket.IO — Live Campaign Updates ──────────────────────────────────────
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// JWT authentication middleware for Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error: no token'));
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super-secret-jwt-key-change-me-in-production'
    );
    socket.user = decoded;
    next();
  } catch {
    next(new Error('Authentication error: invalid token'));
  }
});

io.on('connection', (socket) => {
  // Clients join a campaign-scoped room to receive live updates
  socket.on('join:campaign', (campaignId) => {
    if (campaignId) socket.join(`campaign:${campaignId}`);
  });
  socket.on('leave:campaign', (campaignId) => {
    if (campaignId) socket.leave(`campaign:${campaignId}`);
  });
});

// Expose io globally via singleton (no req needed)
initIO(io);

// Start Server
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`WebSocket /media-stream proxy active -> ws://127.0.0.1:8000`);
  console.log(`Socket.IO live updates active on port ${PORT}`);
});
