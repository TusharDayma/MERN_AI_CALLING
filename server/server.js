import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';

dotenv.config();

import authRoutes from './src/modules/auth/auth.route.js';
import adminRoutes from './src/modules/admin/admin.route.js';
import campaignRoutes from './src/modules/campaigns/campaign.route.js';
import candidateRoutes from './src/modules/candidates/candidate.route.js';
import telephonyRoutes from './src/modules/telephony/telephony.route.js';
import twilioRoutes from './src/modules/twilio/twilio.route.js';
import webhookRoutes from './src/modules/webhooks/webhook.route.js';
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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Domain Routes
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

// Start Server
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`WebSocket /media-stream proxy active -> ws://127.0.0.1:8000`);
});
