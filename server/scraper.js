/**
 * NexaNime Scraper Module
 * Diadaptasi dari script alqanime.js yang diberikan user (creator asli: rynaqrtz)
 * Sumber: https://qrtzcode.my.id/docs/anime/alqanime
 *
 * Semua fungsi di sini murni logic scraping, tidak ada perubahan pada cara
 * data diambil dari alqanime.net — hanya dibungkus jadi module yang bisa
 * dipanggil oleh server Express (server/index.js).
 */

const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://alqanime.net';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
        },
        timeout: 30000,
      });
      await sleep(500 + Math.random() * 1000);
      return response.data;
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1000 * (i + 1));
    }
  }
}

function parseListPage(html) {
  const $ = cheerio.load(html);
  const items = [];
  $('article.bs').each((i, el) => {
    const $el = $(el);
    const title = $el.find('.eggtitle').text().trim() || $el.find('.tt .ntitle').text().trim() || '';
    const url = $el.find('a[itemprop="url"]').attr('href') || '';
    const thumbnail = $el.find('img.ts-post-image').attr('src') || '';
    const status = $el.find('.status').text().trim() || 'Ongoing';
    const type = $el.find('.eggtype').text().trim() || $el.find('.typez').text().trim() || '';
    const ratingScore = $el.find('.numscore').text().trim() || '';
    const ratingPercent = $el.find('.rtb span').attr('style')?.match(/width:([^%]+)%/)?.[1] || '';
    const episode = $el.find('.eggepisode').text().trim() || $el.find('.ntitle').text().match(/Episode\s*\(?(\d+)\)?/)?.[1] || '';
    if (title || url) {
      items.push({ title, url, thumbnail, status, type, ratingScore, ratingPercent, episode });
    }
  });
  return items;
}

async function scrapeHome(page = 1) {
  const url = page === 1 ? `${BASE_URL}/` : `${BASE_URL}/page/${page}/`;
  const html = await fetchPage(url);
  const data = parseListPage(html);
  return { creator: 'rynaqrtz', halaman: 'home', page, data };
}

async function scrapePopular(page = 1) {
  const url = page === 1 ? `${BASE_URL}/popular/` : `${BASE_URL}/popular/page/${page}/`;
  const html = await fetchPage(url);
  const data = parseListPage(html);
  return { creator: 'rynaqrtz', halaman: 'popular', page, data };
}

async function scrapeTag(tag, page = 1) {
  const url = page === 1 ? `${BASE_URL}/tag/${tag}/` : `${BASE_URL}/tag/${tag}/page/${page}/`;
  const html = await fetchPage(url);
  const data = parseListPage(html);
  return { creator: 'rynaqrtz', halaman: 'tag', page, data, tag };
}

async function scrapeJadwal() {
  const url = `${BASE_URL}/jadwal-rilis/`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const result = {};
  $('.bixbox').each((i, el) => {
    const $el = $(el);
    const day = $el.find('.releases h3').text().trim();
    const items = [];
    $el.find('.listupd article.bs').each((j, art) => {
      const $art = $(art);
      const title = $art.find('.eggtitle').text().trim() || $art.find('.tt .ntitle').text().trim() || '';
      const url = $art.find('a[itemprop="url"]').attr('href') || '';
      const thumbnail = $art.find('img.ts-post-image').attr('src') || '';
      const type = $art.find('.eggtype').text().trim() || $art.find('.typez').text().trim() || '';
      const episode = $art.find('.eggepisode').text().trim() || $art.find('.ntitle').text().match(/Episode\s*\(?(\d+)\)?/)?.[1] || $art.find('a[itemprop="url"]').attr('title')?.match(/Episode\s*\(?(\d+)\)?/)?.[1] || '';
      items.push({ title, url, thumbnail, type, episode });
    });
    if (day) result[day] = items;
  });
  return { creator: 'rynaqrtz', halaman: 'jadwal', data: result };
}

async function scrapeGenre() {
  const url = `${BASE_URL}/genre/`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const genres = [];
  $('.blix ul li a').each((i, el) => {
    genres.push($(el).text().trim());
  });
  return { creator: 'rynaqrtz', halaman: 'genre', data: genres };
}

async function scrapeDetail(slugOrUrl) {
  let slug = slugOrUrl;
  if (slugOrUrl.startsWith('http')) {
    const urlObj = new URL(slugOrUrl);
    const pathParts = urlObj.pathname.split('/').filter((p) => p);
    slug = pathParts[pathParts.length - 1] || pathParts[0];
  }
  const url = `${BASE_URL}/${slug}/`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  const title = $('.infox h1').text().trim() || '';
  const thumbnail = $('.thumb img').attr('src') || '';
  const sinopsis = $('.entry-content p').text().trim() || '';
  const info = {};
  $('.spe span').each((i, el) => {
    const text = $(el).text().trim();
    const parts = text.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(':').trim();
      info[key] = value;
    }
  });
  const genres = [];
  $('.genxed a').each((i, el) => {
    genres.push($(el).text().trim());
  });
  const casts = [];
  $('.casts').each((i, el) => {
    casts.push($(el).text().trim());
  });
  const episodes = [];
  $('.soraddl').each((i, el) => {
    const $el = $(el);
    const titleEp = $el.find('.sorattl h3').text().trim() || '';
    const resolutions = [];
    $el.find('table tr').each((j, row) => {
      const $row = $(row);
      const resolution = $row.find('.reso .res').text().trim() || '';
      const links = [];
      $row.find('.slink a').each((k, a) => {
        const href = $(a).attr('href');
        const label = $(a).text().trim();
        if (href) links.push({ label, url: href });
      });
      if (resolution || links.length) {
        resolutions.push({ resolution, links });
      }
    });
    if (titleEp || resolutions.length) {
      episodes.push({ title: titleEp, resolutions });
    }
  });
  const data = { title, thumbnail, sinopsis, info, genres, casts, episodes, slug };
  return { creator: 'rynaqrtz', halaman: 'detail', data };
}

async function scrapeAdvancedSearch(filters = {}, page = 1) {
  const base = `${BASE_URL}/advanced-search/`;
  const query = new URLSearchParams();
  if (filters.genre) filters.genre.forEach((g) => query.append('genre[]', g));
  if (filters.season) filters.season.forEach((s) => query.append('season[]', s));
  if (filters.studio) filters.studio.forEach((s) => query.append('studio[]', s));
  if (filters.status) query.append('status', filters.status);
  if (filters.type) filters.type.forEach((t) => query.append('type[]', t));
  if (filters.order) query.append('order', filters.order);
  const queryString = query.toString();
  const url = page === 1 ? base + (queryString ? `?${queryString}` : '') : `${base}page/${page}/${queryString ? `?${queryString}` : ''}`;
  const html = await fetchPage(url);
  const data = parseListPage(html);
  return { creator: 'rynaqrtz', halaman: 'search', page, filters, data };
}

module.exports = {
  scrapeHome,
  scrapePopular,
  scrapeTag,
  scrapeJadwal,
  scrapeGenre,
  scrapeDetail,
  scrapeAdvancedSearch,
};
