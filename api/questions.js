const path = require('path');
const fs = require('fs');

const DATA_FILE = path.join(__dirname, '..', 'data', 'questions.json');
const BLOB_KEY = 'wtm/questions.json';

// ── Vercel Blob (preferred — BLOB_READ_WRITE_TOKEN already provisioned) ────────
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

// ── Upstash Redis (fallback if UPSTASH_* vars are set) ────────────────────────
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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  if (req.method === 'GET') {
    // 1. Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const data = await blobRead();
        if (data !== null) return res.json(data);
      } catch (e) {
        console.error('Blob GET error:', e.message);
      }
    }
    // 2. Redis
    const redis = getKV();
    if (redis) {
      try {
        const questions = await redis.get('game:questions');
        if (questions !== null) return res.json(questions);
      } catch (e) {
        console.error('Redis GET error:', e.message);
      }
    }
    // 3. Bundled file fallback
    try {
      res.setHeader('Content-Type', 'application/json');
      return res.end(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch {
      return res.json(null);
    }
  }

  if (req.method === 'POST') {
    // 1. Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        await blobWrite(req.body);
        return res.json({ ok: true });
      } catch (e) {
        console.error('Blob POST error:', e.message);
        return res.status(503).json({ ok: false, error: e.message });
      }
    }
    // 2. Redis
    const redis = getKV();
    if (redis) {
      try {
        await redis.set('game:questions', req.body);
        return res.json({ ok: true });
      } catch (e) {
        console.error('Redis SET error:', e.message);
        return res.status(503).json({ ok: false, error: e.message });
      }
    }
    return res.status(503).json({ ok: false, error: 'STORAGE_NOT_CONFIGURED' });
  }

  res.status(405).end('Method Not Allowed');
};
