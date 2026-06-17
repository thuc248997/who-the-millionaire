const { kv } = require('@vercel/kv');

const DEFAULT = { v: 0, flow: null, scores: [0, 0, 0, 0, 0] };

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
    const state = (await kv.get('game:state')) || DEFAULT;
    return res.json(state);
  }

  if (req.method === 'POST') {
    const { kind, ...payload } = req.body;
    const cur = (await kv.get('game:state')) || DEFAULT;
    const next = applyStateUpdate(cur, kind, payload);
    await kv.set('game:state', next);
    return res.json(next);
  }

  res.status(405).end('Method Not Allowed');
};
