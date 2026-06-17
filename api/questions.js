const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(__dirname, '..', 'data', 'questions.json');

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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  if (req.method === 'GET') {
    const redis = getKV();
    if (redis) {
      try {
        const questions = await redis.get('game:questions');
        if (questions !== null) return res.json(questions);
      } catch (e) {
        console.error('Redis GET error:', e.message);
      }
    }
    // Fallback: serve bundled file
    try {
      res.setHeader('Content-Type', 'application/json');
      return res.end(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
      return res.json(null);
    }
  }

  if (req.method === 'POST') {
    const redis = getKV();
    if (!redis) {
      return res.status(503).json({ ok: false, error: 'STORAGE_NOT_CONFIGURED' });
    }
    try {
      await redis.set('game:questions', req.body);
      return res.json({ ok: true });
    } catch (e) {
      console.error('Redis SET error:', e.message);
      return res.status(503).json({ ok: false, error: e.message });
    }
  }

  res.status(405).end('Method Not Allowed');
};
