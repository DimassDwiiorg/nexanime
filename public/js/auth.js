/**
 * Auth demo — NexaNime
 * Ini adalah sesi login SISI KLIEN (disimpan di localStorage) untuk keperluan
 * demo tampilan "logo muncul saat login". Untuk produksi, ganti dengan
 * autentikasi backend sungguhan (JWT/session) di server/index.js.
 */
const NEXA_AUTH_KEY = 'nexanime_session';

const Auth = {
  getUser() {
    try {
      const raw = localStorage.getItem(NEXA_AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  login(username) {
    const user = { username: username.trim(), loginAt: Date.now() };
    localStorage.setItem(NEXA_AUTH_KEY, JSON.stringify(user));
    return user;
  },
  logout() {
    localStorage.removeItem(NEXA_AUTH_KEY);
  },
  requireAuth() {
    const user = this.getUser();
    if (!user) {
      window.location.href = 'login.html';
    }
    return user;
  },
  initials(name) {
    return (name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  },
};
