const DEFAULT = { v: 0, flow: null, scores: [0, 0, 0, 0, 0] };

let _kv = undefined;
function getKV() {
  if (_kv !== undefined) return _kv;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
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

  const redis = getKV();

  if (req.method === 'GET') {
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
    if (!redis) {
      return res.status(503).json({ ok: false, error: 'STORAGE_NOT_CONFIGURED' });
    }
    try {
      const { kind, ...payload } = req.body;
      const cur = (await redis.get('game:state')) || DEFAULT;
      const next = applyStateUpdate(cur, kind, payload);
      await redis.set('game:state', next);
      return res.json(next);
    } catch (e) {
      console.error('Redis POST state error:', e.message);
      return res.status(503).json({ ok: false, error: e.message });
    }
  }

  res.status(405).end('Method Not Allowed');
};
