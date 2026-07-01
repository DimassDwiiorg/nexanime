/**
 * App — NexaNime
 * Router ringan berbasis hash (#/home, #/popular, #/jadwal, #/genre,
 * #/daftar, #/tag/:tag) yang render ke satu shell (index.html).
 */

const view = document.getElementById('view');
const navLinks = document.querySelectorAll('[data-nav]');

function slugify(str) {
  return str.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

function setActiveNav(routeName) {
  navLinks.forEach((a) => a.classList.toggle('active', a.dataset.nav === routeName));
}

function skeletonGrid(n = 12) {
  return `<div class="grid">${'<div class="skel-card skeleton"></div>'.repeat(n)}</div>`;
}

function emptyState(msg = 'Belum ada data untuk ditampilkan.') {
  return `<div class="empty-state"><div class="glyph">◈</div><h3>Kosong</h3><p>${msg}</p></div>`;
}

function errorState(msg) {
  return `<div class="empty-state"><div class="glyph">⚠</div><h3>Gagal memuat</h3><p>${msg}</p></div>`;
}

function cardHTML(item) {
  const href = `detail.html?slug=${encodeURIComponent(extractSlug(item.url))}`;
  const score = item.ratingScore ? `<span class="badge score">★ ${item.ratingScore}</span>` : '';
  const ep = item.episode ? `<span class="badge ep">Eps ${item.episode}</span>` : '';
  const type = item.type ? `<span class="badge">${item.type}</span>` : '';
  return `
    <a class="card" href="${href}">
      <div class="card-thumb">
        ${score}
        ${type}
        <img src="${item.thumbnail}" alt="${item.title}" loading="lazy" onerror="this.style.opacity=0">
        ${ep}
        <div class="card-info"><h3>${item.title}</h3><div class="meta">${item.status || ''}</div></div>
      </div>
    </a>`;
}

function extractSlug(url) {
  if (!url) return '';
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || parts[0] || '';
  } catch {
    return url;
  }
}

function paginationHTML(page, hasMore, hashPrefix) {
  return `
    <div class="pagination">
      <button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}" data-prefix="${hashPrefix}">‹</button>
      <span class="page-label">Halaman ${page}</span>
      <button ${hasMore ? '' : 'disabled'} data-page="${page + 1}" data-prefix="${hashPrefix}">›</button>
    </div>`;
}

function bindPagination(container) {
  container.querySelectorAll('.pagination button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      const prefix = btn.dataset.prefix;
      window.location.hash = `${prefix}?page=${page}`;
    });
  });
}

function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, '') || 'home';
  const [pathPart, queryPart] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const params = new URLSearchParams(queryPart || '');
  return { route: segments[0] || 'home', arg: segments[1] || null, params };
}

/* ---------------- View renderers ---------------- */

async function renderListView({ title, fetcher, page, hashPrefix }) {
  view.innerHTML = `
    <section class="hero">
      <span class="hero-eyebrow"><span class="dot"></span>Live scrape</span>
      <h1>${title}</h1>
    </section>
    <section class="section">${skeletonGrid()}</section>`;
  try {
    const res = await fetcher();
    const items = res.data || [];
    const section = view.querySelector('.section');
    if (!items.length) {
      section.innerHTML = emptyState();
      return;
    }
    section.innerHTML = `
      <div class="grid">${items.map(cardHTML).join('')}</div>
      ${paginationHTML(page, items.length > 0, hashPrefix)}`;
    bindPagination(section);
  } catch (e) {
    view.querySelector('.section').innerHTML = errorState(e.message);
  }
}

async function renderHome(page) {
  await renderListView({
    title: 'Anime terbaru & terpopuler, <em>diperbarui otomatis.</em>',
    fetcher: () => Api.home(page),
    page,
    hashPrefix: '#/home',
  });
  document.querySelector('.hero p')?.remove();
  const hero = view.querySelector('.hero');
  const p = document.createElement('p');
  p.textContent = 'Update rilis episode terbaru langsung dari sumber, tanpa delay berarti — dibungkus cache pintar biar tetap ngebut.';
  hero.appendChild(p);
}

async function renderPopular(page) {
  await renderListView({
    title: 'Paling <em>Populer</em> minggu ini',
    fetcher: () => Api.popular(page),
    page,
    hashPrefix: '#/popular',
  });
}

async function renderTag(tag, page) {
  await renderListView({
    title: `Tag: <em>${tag}</em>`,
    fetcher: () => Api.tag(tag, page),
    page,
    hashPrefix: `#/tag/${tag}`,
  });
}

async function renderJadwal() {
  view.innerHTML = `
    <section class="hero"><span class="hero-eyebrow"><span class="dot"></span>Weekly</span><h1>Jadwal <em>Rilis</em> Mingguan</h1></section>
    <section class="section"><div class="day-tabs" id="dayTabs"></div><div id="jadwalGrid">${skeletonGrid(8)}</div></section>`;
  try {
    const res = await Api.jadwal();
    const days = res.data || {};
    const dayNames = Object.keys(days);
    const tabs = document.getElementById('dayTabs');
    const grid = document.getElementById('jadwalGrid');
    if (!dayNames.length) {
      grid.innerHTML = emptyState('Jadwal rilis tidak tersedia saat ini.');
      return;
    }
    tabs.innerHTML = dayNames.map((d, i) => `<button class="chip ${i === 0 ? 'active' : ''}" data-day="${d}">${d}</button>`).join('');
    function showDay(day) {
      const items = days[day] || [];
      grid.innerHTML = items.length
        ? `<div class="grid">${items.map(cardHTML).join('')}</div>`
        : emptyState('Tidak ada rilis di hari ini.');
    }
    tabs.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        tabs.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        showDay(chip.dataset.day);
      });
    });
    showDay(dayNames[0]);
  } catch (e) {
    document.getElementById('jadwalGrid').innerHTML = errorState(e.message);
  }
}

async function renderGenre() {
  view.innerHTML = `
    <section class="hero"><span class="hero-eyebrow"><span class="dot"></span>86+ genre</span><h1>Jelajahi <em>Genre</em></h1></section>
    <section class="section"><div class="chip-row" id="genreChips">${'<div class="skeleton" style="width:90px;height:32px;border-radius:999px;display:inline-block"></div>'.repeat(16)}</div></section>`;
  try {
    const res = await Api.genre();
    const genres = res.data || [];
    const box = document.getElementById('genreChips');
    box.innerHTML = genres.length
      ? genres.map((g) => `<a class="chip" href="#/tag/${slugify(g)}">${g}</a>`).join('')
      : emptyState('Data genre tidak tersedia.');
  } catch (e) {
    document.getElementById('genreChips').innerHTML = errorState(e.message);
  }
}

async function renderDaftar(page, params) {
  view.innerHTML = `
    <section class="hero"><span class="hero-eyebrow"><span class="dot"></span>Advanced filter</span><h1>Cari & <em>Saring</em> Anime</h1></section>
    <section class="section">
      <div class="filter-bar">
        <select id="fStatus"><option value="">Semua Status</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option></select>
        <select id="fType"><option value="">Semua Tipe</option><option value="tv">TV</option><option value="movie">Movie</option><option value="ova">OVA</option><option value="ona">ONA</option><option value="special">Special</option></select>
        <select id="fOrder"><option value="">Urutkan</option><option value="latest">Terbaru</option><option value="popular">Populer</option><option value="rating">Rating</option><option value="title">Judul A-Z</option></select>
        <button class="btn" id="applyFilter">Terapkan</button>
      </div>
      <div id="daftarGrid">${skeletonGrid()}</div>
    </section>`;
  const fStatus = document.getElementById('fStatus');
  const fType = document.getElementById('fType');
  const fOrder = document.getElementById('fOrder');
  fStatus.value = params.get('status') || '';
  fType.value = params.get('type') || '';
  fOrder.value = params.get('order') || '';

  async function load() {
    const grid = document.getElementById('daftarGrid');
    grid.innerHTML = skeletonGrid();
    const filters = {
      status: fStatus.value || undefined,
      type: fType.value || undefined,
      order: fOrder.value || undefined,
    };
    try {
      const res = await Api.daftar(filters, page);
      const items = res.data || [];
      grid.innerHTML = items.length
        ? `<div class="grid">${items.map(cardHTML).join('')}</div>${paginationHTML(page, items.length > 0, '#/daftar')}`
        : emptyState('Tidak ada hasil untuk filter ini.');
      bindPagination(grid);
    } catch (e) {
      grid.innerHTML = errorState(e.message);
    }
  }
  document.getElementById('applyFilter').addEventListener('click', () => {
    window.location.hash = `#/daftar?page=1&status=${fStatus.value}&type=${fType.value}&order=${fOrder.value}`;
  });
  load();
}

/* ---------------- Router ---------------- */
async function router() {
  const { route, arg, params } = parseHash();
  const page = parseInt(params.get('page'), 10) || 1;
  setActiveNav(route);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (route === 'home') return renderHome(page);
  if (route === 'popular') return renderPopular(page);
  if (route === 'jadwal') return renderJadwal();
  if (route === 'genre') return renderGenre();
  if (route === 'daftar') return renderDaftar(page, params);
  if (route === 'tag' && arg) return renderTag(arg, page);
  return renderHome(page);
}

window.addEventListener('hashchange', router);

/* ---------------- Nav user + search + drawer ---------------- */
function initChrome() {
  const user = Auth.requireAuth();
  if (!user) return;

  document.querySelectorAll('[data-username]').forEach((el) => (el.textContent = user.username));
  document.querySelectorAll('[data-initials]').forEach((el) => (el.textContent = Auth.initials(user.username)));

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    Auth.logout();
    window.location.href = 'login.html';
  });

  const searchInput = document.getElementById('navSearchInput');
  if (searchInput) {
    let t;
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && searchInput.value.trim()) {
        window.location.hash = `#/tag/${slugify(searchInput.value)}`;
      }
    });
  }

  const hamburger = document.getElementById('hamburger');
  const drawer = document.getElementById('drawer');
  hamburger?.addEventListener('click', () => drawer.classList.add('show'));
  drawer?.addEventListener('click', (e) => {
    if (e.target === drawer) drawer.classList.remove('show');
  });
  drawer?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => drawer.classList.remove('show')));
}

document.addEventListener('DOMContentLoaded', () => {
  initChrome();
  router();
});
