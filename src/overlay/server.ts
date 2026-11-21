import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const HTTP_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json());

// Serve static overlay and stage assets
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Current Stage LED Wall state
let currentStageVerse: any = null;
let stageVerseStartTime: number | null = null;
const STAGE_SAFETY_CEILING_MS = 5 * 60 * 1000; // 5 minutes

let stageConfig = {
  idleMode: 'graphic', // 'graphic' | 'motion'
  idleGraphicUrl: '/images/default-sermon.svg',
  motionLoopUrl: ''
};

// Current active lower-third verse state
let currentOverlayVerse: any = null;

// Track active WebSocket clients
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[Lumen Server] New display client connected (${clients.size} total)`);

  // Send initial stage state
  ws.send(JSON.stringify({ type: 'stage:config', data: stageConfig }));

  if (currentStageVerse) {
    ws.send(JSON.stringify({ type: 'stage:verse', data: currentStageVerse }));
  }

  // Send initial lower-third state
  if (currentOverlayVerse) {
    ws.send(JSON.stringify({ type: 'verse:show', data: currentOverlayVerse }));
  }

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[Lumen Server] Display client disconnected (${clients.size} remaining)`);
  });
});

function broadcast(message: object) {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    displayClients: clients.size,
    currentStageVerse,
    stageVerseStartTime,
    stageConfig
  });
});

// Stage LED Wall display endpoint
app.get('/stage', (req, res) => {
  res.sendFile(path.join(publicDir, 'stage.html'));
});

// Lower-third overlay endpoint
app.get('/overlay', (req, res) => {
  res.sendFile(path.join(publicDir, 'overlay.html'));
});

// Fullscreen overlay endpoint
app.get('/overlay-full', (req, res) => {
  res.sendFile(path.join(publicDir, 'overlay-full.html'));
});

// POST to Stage LED Wall (Default 5 min ceiling)
app.post('/api/stage/display', (req, res) => {
  const { reference, translation, text, duration = STAGE_SAFETY_CEILING_MS } = req.body;

  if (!reference || !text) {
    return res.status(400).json({ error: 'Missing reference or text' });
  }

  currentStageVerse = {
    id: `stage_v_${Date.now()}`,
    reference,
    translation: translation || 'KJV',
    text,
    duration
  };
  stageVerseStartTime = Date.now();

  broadcast({ type: 'stage:verse', data: currentStageVerse });
  res.json({ success: true, stageVerse: currentStageVerse, startedAt: stageVerseStartTime });
});

// Clear Stage LED Wall (Return to idle sermon graphic)
app.post('/api/stage/clear', (req, res) => {
  currentStageVerse = null;
  stageVerseStartTime = null;
  broadcast({ type: 'stage:clear' });
  res.json({ success: true });
});

// Update Stage Configuration (idle mode, sermon graphic URL, motion loop URL)
app.post('/api/stage/config', (req, res) => {
  const { idleMode, idleGraphicUrl, motionLoopUrl } = req.body;
  if (idleMode) stageConfig.idleMode = idleMode;
  if (idleGraphicUrl) stageConfig.idleGraphicUrl = idleGraphicUrl;
  if (motionLoopUrl !== undefined) stageConfig.motionLoopUrl = motionLoopUrl;

  broadcast({ type: 'stage:config', data: stageConfig });
  res.json({ success: true, stageConfig });
});

// Existing Lower-Third display endpoint (for backwards compatibility)
app.post('/api/display', (req, res) => {
  const { reference, translation, text, duration = 15000 } = req.body;

  if (!reference || !text) {
    return res.status(400).json({ error: 'Missing reference or text' });
  }

  currentOverlayVerse = {
    id: `v_${Date.now()}`,
    reference,
    translation: translation || 'KJV',
    text,
    duration
  };

  broadcast({ type: 'verse:show', data: currentOverlayVerse });
  res.json({ success: true, verse: currentOverlayVerse });
});

// Clear Lower-Third display
app.post('/api/clear', (req, res) => {
  currentOverlayVerse = null;
  broadcast({ type: 'verse:clear' });
  res.json({ success: true });
});

// Start listening
server.listen(HTTP_PORT, () => {
  console.log(`[Lumen Server] Running at http://localhost:${HTTP_PORT}`);
  console.log(`[Lumen Server] 📺 Stage LED Wall Output: http://localhost:${HTTP_PORT}/stage`);
  console.log(`[Lumen Server] 📡 Lower-Third Overlay:    http://localhost:${HTTP_PORT}/overlay`);
});
