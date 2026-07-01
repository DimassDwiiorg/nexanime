# NexaNime

> Catatan penting soal "API": (`/docs/anime/alqanime` dan
> `/api/embed/anime/alqanime`) itu isinya halaman dokumentasi + iframe embed,
> **bukan** endpoint JSON yang bisa dipanggil langsung dari browser. Yang
> benar-benar berfungsi sebagai "API" adalah script Node.js (`alqanime.js`)
> yang kamu upload — itu scraper yang jalan di server, pakai `axios` +
> `cheerio` untuk mengambil data dari `alqanime.net`. Makanya proyek ini saya
> bikin **full-stack**: backend Express membungkus scraper itu jadi REST API
> JSON, lalu frontend NexaNime memanggil API tersebut. Ini juga menghindari
> masalah CORS/rate-limit kalau scraping dilakukan langsung dari browser.

## Struktur folder

```
nexanime/
├── server/           # Backend Express (REST API + serve frontend)
│   ├── index.js
│   ├── scraper.js    # scraper alqanime, diadaptasi dari alqanime.js kamu
│   └── package.json
└── public/            # Frontend statis
    ├── index.html      # Shell utama (home, populer, jadwal, genre, filter)
    ├── login.html       # Halaman login (logo NexaNime tampil di sini)
    ├── detail.html       # Halaman detail anime + episode + link download
    ├── css/style.css
    ├── js/{auth,api,app}.js
    └── assets/logo.svg
```

## Cara menjalankan

```bash
cd server
npm install
npm start
```

Lalu buka **http://localhost:3000** di browser. Backend otomatis serve
frontend juga, jadi kamu tidak perlu server terpisah.

## Fitur yang tersedia

| Fitur          | Endpoint backend      | Halaman frontend                    |
|-----------------|------------------------|--------------------------------------|
| Login (demo)    | —                       | `login.html`                          |
| Home            | `GET /api/home`         | `index.html#/home`                    |
| Populer         | `GET /api/popular`      | `index.html#/popular`                 |
| Tag / pencarian | `GET /api/tag/:tag`     | `index.html#/tag/:tag` (dari kotak cari) |
| Jadwal rilis    | `GET /api/jadwal`       | `index.html#/jadwal`                  |
| Genre (86+)     | `GET /api/genre`        | `index.html#/genre`                   |
| Filter lanjutan | `GET /api/daftar`       | `index.html#/daftar`                  |
| Detail anime    | `GET /api/detail?slug=` | `detail.html?slug=...`                |

Semua endpoint di-cache 5 menit di memori server supaya navigasi berasa
instan dan tidak membebani `alqanime.net` (anti-lag, sesuai permintaan).

## Tentang login & logo

Login di proyek ini adalah **demo sisi klien**: sesi disimpan di
`localStorage` browser, isi username/password apa saja sudah bisa masuk.
Logo NexaNime tampil besar di tengah kartu login (`login.html`), lalu tetap
muncul di navbar setelah masuk. Untuk produksi sungguhan, ganti `auth.js`
dengan pemanggilan endpoint login backend yang menyimpan user di
database + JWT/session cookie.

## Catatan tentang data episode/streaming

Setelah dicek langsung ke `alqanime.net`, situs itu **murni situs download
batch** — tidak punya pemutar video sendiri di halaman manapun. Semua link
episode mengarah ke *file host* pihak ketiga: AceFile, MediaFire, GoFile,
ouo.io, dan PixelDrain. Tidak ada iframe streaming di HTML-nya sama sekali
(klaim "auto scrape iframe AceFile" di dokumentasi awal tidak sesuai kondisi
situs saat ini).

**Solusi yang dipakai di NexaNime — "nonton tanpa pindah situs":**
- Link **PixelDrain** dirender sebagai tombol **▶ Putar**, yang membuka
  pemutar video di dalam modal NexaNime (`detail.html`), memakai endpoint
  embed PixelDrain (`/api/filesystem/{id}?embed`). User tetap di NexaNime
  selama menonton.
- Link host lain (AceFile/MediaFire/GoFile/ouo.io) tetap jadi tombol
  **Unduh** yang buka tab baru, karena host-host itu memblokir iframe
  (X-Frame-Options) atau mewajibkan klik halaman iklan/wait-timer dulu —
  jadi secara teknis tidak bisa ditanam di halaman lain.
- Kalau suatu saat sumbernya berubah dan benar-benar punya iframe player
  (mis. AceFile menyediakan endpoint embed publik di masa depan), tinggal
  tambahkan deteksi domainnya di `toPixeldrainEmbed()` (`detail.html`) atau
  buat fungsi serupa, lalu render tombol "▶ Putar" untuk domain itu juga.

## Kustomisasi tema

Semua warna & efek glow ada di `public/css/style.css` bagian `:root`
(`--blue-500`, `--cyan`, `--glow-soft`, dst.) — tinggal ubah nilainya kalau
ingin nuansa biru yang lebih terang/gelap.
# nexanime
