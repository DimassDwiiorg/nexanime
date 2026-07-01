/**
 * API client — NexaNime
 * Semua request diarahkan ke backend Express (server/index.js) yang
 * membungkus scraper alqanime, jadi tidak ada CORS issue / rate-limit
 * langsung dari browser ke sumber.
 */
const Api = {
  base: '/api',

  async _get(path) {
    const res = await fetch(this.base + path);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || `Request gagal (${res.status})`);
    }
    return res.json();
  },

  home(page = 1) {
    return this._get(`/home?page=${page}`);
  },
  popular(page = 1) {
    return this._get(`/popular?page=${page}`);
  },
  tag(tag, page = 1) {
    return this._get(`/tag/${encodeURIComponent(tag)}?page=${page}`);
  },
  jadwal() {
    return this._get('/jadwal');
  },
  genre() {
    return this._get('/genre');
  },
  detail(slugOrUrl) {
    const key = slugOrUrl.startsWith('http') ? 'url' : 'slug';
    return this._get(`/detail?${key}=${encodeURIComponent(slugOrUrl)}`);
  },
  daftar(filters = {}, page = 1) {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) q.set(k, Array.isArray(v) ? v.join(',') : v);
    });
    q.set('page', page);
    return this._get(`/daftar?${q.toString()}`);
  },
};
