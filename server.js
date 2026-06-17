const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = 8080;
const DATA_DIR = path.join(__dirname, 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// ── In-memory state ──────────────────────────────────────────────────────────
let state = { v: 0, flow: null, scores: [0, 0, 0, 0, 0] };

// ── MIME types ───────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.ttf':  'font/ttf',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
};

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── API: state ─────────────────────────────────────────────────────────────
  if (pathname === '/api/state') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state));
      return;
    }
    if (req.method === 'POST') {
      readBody(req).then(body => {
        try {
          const { kind, ...payload } = JSON.parse(body);
          state = applyStateUpdate(state, kind, payload);
          broadcast({ type: 'state', ...state });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(state));
        } catch (e) {
          res.writeHead(400); res.end('Bad request');
        }
      });
      return;
    }
  }

  // ── API: questions ─────────────────────────────────────────────────────────
  if (pathname === '/api/questions') {
    if (req.method === 'GET') {
      if (!fs.existsSync(QUESTIONS_FILE)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('null');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
      return;
    }
    if (req.method === 'POST') {
      readBody(req).then(body => {
        try {
          JSON.parse(body); // validate
          fs.writeFileSync(QUESTIONS_FILE, body, 'utf8');
          broadcast({ type: 'questions_updated' });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
        } catch (e) {
          res.writeHead(400); res.end('Bad request');
        }
      });
      return;
    }
  }

  // ── Static files ──────────────────────────────────────────────────────────
  let filePath = path.join(__dirname, pathname === '/' ? 'game.html' : pathname);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
});

// ── WebSocket ─────────────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server });
const clients = new Map(); // ws → { role }

wss.on('connection', ws => {
  clients.set(ws, { role: 'unknown' });

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'identify') {
        clients.get(ws).role = msg.role || 'unknown';
        broadcastPresence();
      }
    } catch {}
  });

  ws.on('close', () => { clients.delete(ws); broadcastPresence(); });
  ws.on('error', () => { try { ws.close(); } catch {} });

  // send current state on connect
  ws.send(JSON.stringify({ type: 'state', ...state }));
});

function broadcast(msg) {
  const data = JSON.stringify(msg);
  for (const [ws] of clients) {
    if (ws.readyState === ws.OPEN) ws.send(data);
  }
}

function broadcastPresence() {
  const counts = {};
  for (const [, { role }] of clients) counts[role] = (counts[role] || 0) + 1;
  broadcast({ type: 'presence', counts });
}

// ── State update logic ────────────────────────────────────────────────────────
function applyStateUpdate(cur, kind, payload) {
  const next = { ...cur, v: cur.v + 1 };

  if (kind === 'flow') {
    next.flow = payload.flow ?? null;
  } else if (kind === 'scores:set') {
    next.scores = (payload.scores || [0,0,0,0,0]).map(s => Math.max(0, Number(s) || 0));
  } else if (kind === 'adjust') {
    const deltas = payload.deltas || [];
    next.scores = cur.scores.map((s, i) => Math.max(0, s + (Number(deltas[i]) || 0)));
  }

  return next;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`  Game host : http://localhost:${PORT}/game.html`);
  console.log(`  Score board: http://localhost:${PORT}/score.html`);
  console.log(`  Admin     : http://localhost:${PORT}/admin.html`);
});
