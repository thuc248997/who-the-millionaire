const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  if (req.method === 'GET') {
    const questions = await kv.get('game:questions');
    return res.json(questions);
  }

  if (req.method === 'POST') {
    await kv.set('game:questions', req.body);
    return res.json({ ok: true });
  }

  res.status(405).end('Method Not Allowed');
};
