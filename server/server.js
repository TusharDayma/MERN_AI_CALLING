import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Load env vars
dotenv.config();
import prisma from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import hrRoutes from './routes/hrRoutes.js';
import twilioRoutes from './routes/twilioRoutes.js';

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/twilio', twilioRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'AntiTalk API is running' });
});

// AI Engine Webhook Endpoint
app.post('/api/webhooks/call-completed', async (req, res) => {
  try {
    const { candidate_id, ai_score, dossier_json } = req.body;
    
    if (!candidate_id) {
      return res.status(400).json({ success: false, error: 'candidate_id is required' });
    }

    // Save to database
    await prisma.candidate.update({
      where: { id: candidate_id },
      data: {
        ai_score: ai_score,
        dossier_json: JSON.stringify(dossier_json),
        status: 'COMPLETED'
      }
    });

    console.log(`[Webhook] Updated candidate ${candidate_id} with score ${ai_score}`);
    res.status(200).json({ success: true, message: 'Webhook received and candidate updated' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: 'Failed to update candidate' });
  }
});

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
