/**
 * NexaNime Server
 * Express server yang membungkus scraper alqanime.js menjadi REST API JSON,
 * plus serve frontend statis (folder /public).
 *
 * Cara jalanin:
 *   cd server
 *   npm install
 *   npm start
 * Lalu buka http://localhost:3000
 */

const express = require('express');
const path = require('path');
const scraper = require('./scraper');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ---------- Simple in-memory cache (anti-lag, kurangi request berulang ke sumber) ----------
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 menit
const cache = new Map();

function cacheKey(req) {
  return req.originalUrl;
}

function getCache(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.time > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
}

async function handle(req, res, fn) {
  const key = cacheKey(req);
  const cached = getCache(key);
  if (cached) {
    res.set('X-Cache', 'HIT');
    return res.json(cached);
  }
  try {
    const result = await fn();
    setCache(key, result);
    res.set('X-Cache', 'MISS');
    res.json(result);
  } catch (err) {
    res.status(502).json({
      error: true,
      message: 'Gagal mengambil data dari sumber. Coba lagi sebentar lagi.',
      detail: err.message,
    });
  }
}

// ---------- API Routes ----------

app.get('/api/home', (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  handle(req, res, () => scraper.scrapeHome(page));
});

app.get('/api/popular', (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  handle(req, res, () => scraper.scrapePopular(page));
});

app.get('/api/tag/:tag', (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  handle(req, res, () => scraper.scrapeTag(req.params.tag, page));
});

app.get('/api/jadwal', (req, res) => {
  handle(req, res, () => scraper.scrapeJadwal());
});

app.get('/api/genre', (req, res) => {
  handle(req, res, () => scraper.scrapeGenre());
});

app.get('/api/detail', (req, res) => {
  const input = req.query.slug || req.query.url;
  if (!input) {
    return res.status(400).json({ error: true, message: 'Parameter slug atau url wajib diisi.' });
  }
  handle(req, res, () => scraper.scrapeDetail(input));
});

app.get('/api/daftar', (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const filters = {};
  if (req.query.genre) filters.genre = String(req.query.genre).split(',').map((s) => s.trim());
  if (req.query.season) filters.season = String(req.query.season).split(',').map((s) => s.trim());
  if (req.query.studio) filters.studio = String(req.query.studio).split(',').map((s) => s.trim());
  if (req.query.status) filters.status = req.query.status;
  if (req.query.type) filters.type = String(req.query.type).split(',').map((s) => s.trim());
  if (req.query.order) filters.order = req.query.order;
  handle(req, res, () => scraper.scrapeAdvancedSearch(filters, page));
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'NexaNime API', time: new Date().toISOString() });
});

// ---------- Serve frontend ----------
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NexaNime server jalan di http://localhost:${PORT}`);
});
