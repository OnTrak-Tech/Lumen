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

// Serve static overlay client assets
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Current active verse state
let currentVerse: any = null;

// Track active WebSocket clients (OBS Browser Sources)
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[Lumen Overlay] New OBS overlay client connected (${clients.size} total)`);

  // If a verse is currently active, send it immediately
  if (currentVerse) {
    ws.send(JSON.stringify({ type: 'verse:show', data: currentVerse }));
  }

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[Lumen Overlay] Overlay client disconnected (${clients.size} remaining)`);
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
    overlayClients: clients.size,
    currentVerse
  });
});

// Lower-third overlay endpoint
app.get('/overlay', (req, res) => {
  res.sendFile(path.join(publicDir, 'overlay.html'));
});

// Fullscreen overlay endpoint
app.get('/overlay-full', (req, res) => {
  res.sendFile(path.join(publicDir, 'overlay-full.html'));
});

// Display verse endpoint (called by Operator UI or auto-mode)
app.post('/api/display', (req, res) => {
  const { reference, translation, text, duration = 15000 } = req.body;

  if (!reference || !text) {
    return res.status(400).json({ error: 'Missing reference or text' });
  }

  currentVerse = {
    id: `v_${Date.now()}`,
    reference,
    translation: translation || 'KJV',
    text,
    duration
  };

  broadcast({ type: 'verse:show', data: currentVerse });
  res.json({ success: true, verse: currentVerse });
});

// Clear / dismiss verse endpoint
app.post('/api/clear', (req, res) => {
  currentVerse = null;
  broadcast({ type: 'verse:clear' });
  res.json({ success: true });
});

// Start listening
server.listen(HTTP_PORT, () => {
  console.log(`[Lumen Server] Running at http://localhost:${HTTP_PORT}`);
  console.log(`[Lumen Server] Lower-third overlay: http://localhost:${HTTP_PORT}/overlay`);
  console.log(`[Lumen Server] Fullscreen overlay:   http://localhost:${HTTP_PORT}/overlay-full`);
});
