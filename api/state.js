const BLOB_KEY = 'wtm/state.json';
const DEFAULT = { v: 0, flow: null, scores: [0, 0, 0, 0, 0] };

// ── Vercel Blob ────────────────────────────────────────────────────────────────
async function blobRead() {
  const { list } = require('@vercel/blob');
  const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
  if (!blobs.length) return null;
  const res = await fetch(blobs[0].url, { cache: 'no-store' });
  if (!res.ok) return null;
  return await res.json();
}

async function blobWrite(data) {
  const { put } = require('@vercel/blob');
  await put(BLOB_KEY, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
}

// ── Upstash Redis (fallback) ───────────────────────────────────────────────────
let _kv = undefined;
function getKV() {
  if (_kv !== undefined) return _kv;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) { _kv = null; return null; }
  try {
    const { Redis } = require('@upstash/redis');
    _kv = new Redis({ url, token });
  } catch (e) {
    console.error('Redis init error:', e.message);
    _kv = null;
  }
  return _kv;
}

function applyStateUpdate(cur, kind, payload) {
  const next = { ...cur, v: cur.v + 1 };
  if (kind === 'flow') {
    next.flow = payload.flow ?? null;
  } else if (kind === 'scores:set') {
    next.scores = (payload.scores || [0, 0, 0, 0, 0]).map(s => Math.max(0, Number(s) || 0));
  } else if (kind === 'adjust') {
    const deltas = payload.deltas || [];
    next.scores = cur.scores.map((s, i) => Math.max(0, s + (Number(deltas[i]) || 0)));
  }
  return next;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  if (req.method === 'GET') {
    // 1. Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const state = await blobRead();
        if (state !== null) return res.json(state);
      } catch (e) {
        console.error('Blob GET state error:', e.message);
      }
    }
    // 2. Redis
    const redis = getKV();
    if (redis) {
      try {
        const state = await redis.get('game:state');
        return res.json(state || DEFAULT);
      } catch (e) {
        console.error('Redis GET state error:', e.message);
      }
    }
    return res.json(DEFAULT);
  }

  if (req.method === 'POST') {
    const { kind, ...payload } = req.body;

    // 1. Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const cur = await blobRead().catch(() => null) || DEFAULT;
        const next = applyStateUpdate(cur, kind, payload);
        await blobWrite(next);
        return res.json(next);
      } catch (e) {
        console.error('Blob POST state error:', e.message);
        return res.status(503).json({ ok: false, error: e.message });
      }
    }
    // 2. Redis
    const redis = getKV();
    if (redis) {
      try {
        const cur = (await redis.get('game:state')) || DEFAULT;
        const next = applyStateUpdate(cur, kind, payload);
        await redis.set('game:state', next);
        return res.json(next);
      } catch (e) {
        console.error('Redis POST state error:', e.message);
        return res.status(503).json({ ok: false, error: e.message });
      }
    }
    return res.status(503).json({ ok: false, error: 'STORAGE_NOT_CONFIGURED' });
  }

  res.status(405).end('Method Not Allowed');
};
