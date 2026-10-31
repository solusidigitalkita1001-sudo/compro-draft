# Solusi Digital Kita — Struktur Reusable (Build-time Include)

Sistem ini mengubah 14 halaman HTML statis kamu supaya navbar, topbar,
footer, offcanvas mobile menu, dan megamenu **hanya ditulis satu kali**,
lalu otomatis "ditempel" ke semua halaman saat build. Hasil akhirnya
tetap HTML/CSS/JS statis murni — tanpa framework, tanpa dependency
saat runtime.

## 1. Yang perlu kamu lakukan dulu

Folder `css/`, `js/`, `image/`, `icons/`, `scss/`, `contact/` di sini
masih **kosong** (cuma ada file penanda). Copy folder asli kamu dari
project `Solusi Digital Kita` ke sini, timpa foldernya, isinya tidak diubah sama
sekali oleh sistem ini.

## 2. Struktur folder

```
project/
├── source/
│   ├── partials/          <- bagian yang SAMA di semua halaman
│   │   ├── head-links.html        (link CSS + placeholder {{EXTRA_CSS}})
│   │   ├── preloader.html
│   │   ├── topbar.html
│   │   ├── header.html            (navbar desktop)
│   │   ├── footer.html            (+ placeholder {{FOOTER_MARQUEE}})
│   │   ├── offcanvas-mobile.html  (navbar mobile / hamburger menu)
│   │   ├── offcanvas-megamenu.html
│   │   └── scripts-common.html    (+ placeholder {{EXTRA_SCRIPTS}})
│   └── pages/             <- konten UNIK tiap halaman saja
│       ├── index.html
│       ├── about-us.html
│       └── ... (14 halaman)
├── page.config.json        <- title, meta description, script/CSS
│                              tambahan, dan teks marquee per halaman
├── build.js                 <- jalankan ini untuk generate hasil akhir
├── css/ js/ image/ icons/ scss/ contact/   <- aset asli kamu
└── dist/                    <- HASIL BUILD (yang di-upload ke hosting)
```

## 3. Cara pakai

```bash
node build.js
```

Ini akan membuat folder `dist/` berisi 14 file `.html` statis biasa
(sudah lengkap dengan navbar/footer di-inject, menu aktif otomatis
tertandai sesuai halaman, dan aset ter-copy). **Folder `dist/` inilah
yang di-upload ke hosting client** — bukan folder `source/`.

Setiap kali kamu edit sesuatu di `source/partials/` atau
`source/pages/`, jalankan lagi `node build.js` untuk regenerate.

## 4. Cara kerja tiap fitur

### Navbar/footer sekali tulis
Setiap halaman di `source/pages/*.html` cuma berisi konten unik
halaman itu + baris seperti:
```html
<!--@include(partials/header.html)-->
```
`build.js` akan membaca partial itu dan menempelkannya. Include
bersifat **nested** (partial bisa include partial lain).

### Menu aktif otomatis
Kamu **tidak perlu** menambahkan class `current-menu-item` secara
manual. `build.js` mendeteksi halaman mana yang sedang di-build lalu
otomatis menandai `<li>` yang `href`-nya cocok dengan nama file
halaman tersebut — baik di navbar desktop maupun mobile.

### Script & CSS tambahan per halaman
Beberapa halaman butuh library tambahan (contoh: `contact.html` butuh
`map.js`+`map.min.css` untuk Google Maps; halaman lain butuh
`swiper`, `nice-select`, `odometer`, dst). Ini diatur di
`page.config.json` per halaman lewat `extraScripts` dan `extraCss`,
lalu di-inject otomatis lewat placeholder `{{EXTRA_SCRIPTS}}` /
`{{EXTRA_CSS}}`.

### Teks CTA marquee di footer
Tulisan berjalan "Get In Touch ..." di footer beda teks & jumlah
pengulangan tiap halaman (misalnya `contact.html` tidak menampilkan
"Contact Us" karena user sudah di halaman itu). Ini disimpan per
halaman di `page.config.json` (`footerMarquee`) dan di-inject lewat
placeholder `{{FOOTER_MARQUEE}}` di `footer.html`.

## 5. Menambah halaman baru

1. Duplikat salah satu file di `source/pages/` (misal `about-us.html`)
   jadi nama baru, contoh `careers.html`.
2. Ganti konten di antara komentar:
   ```html
   <!-- ============ UNIQUE PAGE CONTENT START ============ -->
   ...
   <!-- ============ UNIQUE PAGE CONTENT END ============== -->
   ```
3. Tambahkan link menu ke halaman baru di `source/partials/header.html`
   dan `source/partials/offcanvas-mobile.html` (sekali saja, otomatis
   muncul di semua halaman lain juga).
4. Tambahkan entry baru di `page.config.json` (copy salah satu entry
   yang sudah ada sebagai contoh, sesuaikan `title`, `description`,
   `extraScripts`, `extraCss`, `footerMarquee`).
5. Jalankan `node build.js` lagi.

## 6. Mengedit navbar/footer

Cukup edit filenya sekali di `source/partials/header.html` (atau
`footer.html`, dll), lalu `node build.js` — otomatis berlaku ke
semua 14 halaman.

## 8. Bilingual (Indonesia + English)

Sistem ini sudah mendukung 2 bahasa:

- **Indonesia** = default, di root (`dist/about-us.html`, dst)
- **English** = di `dist/en/` (`dist/en/about-us.html`, dst)

### Struktur

```
source/
  i18n/
    id.json     <- teks UI Indonesia (menu, tombol, footer, dst)
    en.json     <- teks UI English
  pages/
    id/*.html   <- konten Indonesia (14 halaman)
    en/*.html   <- konten English (14 halaman)
page.config.json  <- sekarang dibagi 2: { "id": {...}, "en": {...} }
```

### Bagian yang OTOMATIS diterjemahkan (partial/navbar/footer)

Teks di `header.html`, `topbar.html`, `offcanvas-mobile.html`, dan
`footer.html` (menu navbar, tombol "Get A Quote"/"Minta Penawaran",
label footer, newsletter, copyright, dll) sudah pakai token
`{{t.nama_key}}`. Nilainya diambil dari `source/i18n/id.json` atau
`source/i18n/en.json` tergantung bahasa yang sedang di-build.

**Untuk menambah/mengubah teks UI:** edit key yang sesuai di kedua
file JSON (`id.json` dan `en.json`), lalu `node build.js`. Tidak
perlu sentuh file partial HTML sama sekali.

**Untuk menambah teks UI baru** (misal ada tombol baru di partial):
1. Tambahkan `{{t.nama_key_baru}}` di file partial HTML.
2. Tambahkan `"nama_key_baru": "..."` di `id.json` dan `en.json`.

### Bagian yang PERLU diterjemahkan MANUAL (konten unik tiap halaman)

Paragraf, judul, deskripsi layanan, testimonial, dan konten bebas
lainnya di tiap halaman **tidak** bisa diterjemahkan otomatis (ini
tulisan bebas, bukan sekadar lookup kata). Saat ini
`source/pages/id/*.html` masih **salinan persis** dari
`source/pages/en/*.html` (Bahasa Inggris) — silakan terjemahkan
langsung teksnya di dalam file `source/pages/id/*.html`. Jangan
ubah tag HTML/class-nya, cukup ganti teksnya saja.

Setelah menerjemahkan, jangan lupa update juga `page.config.json`
bagian `"id"` untuk `title` dan `description` tiap halaman (untuk
SEO), lalu jalankan `node build.js` lagi.

> Kalau butuh bantuan menerjemahkan konten satu-satu, tinggal minta
> Claude bantu terjemahkan isi `source/pages/id/<nama-halaman>.html`.

### Cara kerja link antar bahasa

- Semua link antar halaman di partial sudah pakai placeholder
  `{{LANG_PREFIX}}` (otomatis jadi kosong untuk ID, `en/` untuk EN).
- Ada tombol ganti bahasa ("ID"/"EN") di topbar kanan atas — otomatis
  mengarah ke halaman yang sama di bahasa lain.
- Tag `hreflang` (SEO) otomatis ditambahkan di setiap halaman.
- Semua path CSS/JS/gambar memakai path absolut (`/css/...`) supaya
  tetap benar walau halaman ada di `/en/`.

### Menambah bahasa ke-3

1. Buat `source/i18n/<kode>.json` (copy dari `id.json`, terjemahkan).
2. Buat folder `source/pages/<kode>/` (copy dari `pages/id/`,
   terjemahkan konten uniknya).
3. Tambahkan entry `<kode>: {...}` di `page.config.json`.
4. Tambahkan locale baru di `build.js`:
   ```js
   const LOCALES = {
     id: { prefix: "", htmlLang: "id", sibLocale: "id" },
     en: { prefix: "en/", htmlLang: "en", sibLocale: "en" },
     zh: { prefix: "zh/", htmlLang: "zh", sibLocale: "zh" },
   };
   ```

5. `node build.js`.

## 10. Deploy ke VPS pakai Docker

File yang disediakan:
- `Dockerfile` -- multi-stage: stage 1 jalankan `node build.js` (build),
  stage 2 serve hasil `dist/` pakai nginx (runtime). Image akhir kecil
  karena tidak membawa Node.js sama sekali, cuma nginx + hasil build statis.
- `nginx.conf` -- config nginx di dalam container (gzip, cache-control
  untuk asset, no-cache untuk HTML supaya update langsung tampil).
- `docker-compose.yml` -- untuk deploy di belakang nginx reverse proxy
  eksternal yang sudah ada di VPS kamu (tidak publish port ke host,
  join network eksternal `proxy-network`, sama seperti pola HMS/HRIS).
- `docker-compose.standalone.yml` -- untuk testing lokal, langsung
  publish ke `localhost:8080` tanpa reverse proxy.
- `.dockerignore` -- supaya `dist/` lama & `node_modules` tidak ikut
  ke-copy ke build context.

### Testing lokal dulu (opsional tapi disarankan)

```bash
docker compose -f docker-compose.standalone.yml up -d --build
```

Buka `http://localhost:8083` (Indonesia) dan `http://localhost:8083/en/`
(English). Kalau sudah oke, `docker compose -f docker-compose.standalone.yml down`.

### Deploy di VPS (di belakang nginx reverse proxy yang sudah ada)

1. Pastikan network eksternal untuk reverse proxy kamu sudah ada:
   ```bash
   docker network ls | grep proxy-network
   ```
   Kalau belum ada, sesuaikan nama network di `docker-compose.yml`
   dengan network reverse proxy yang sudah jalan di VPS kamu (cek
   dengan `docker network ls`), atau buat baru:
   ```bash
   docker network create proxy-network
   ```

2. Kalau reverse proxy kamu tipe **nginx-proxy** (auto-routing lewat
   env var `VIRTUAL_HOST`) -- buka `docker-compose.yml`, uncomment
   bagian `environment:` dan ganti dengan domain client:
   ```yaml
   environment:
     VIRTUAL_HOST: Solusi Digital Kita.example.com
   ```
   Kalau reverse proxy kamu config manual (server block sendiri di
   `/root/infrastructure`), tambahkan server block yang mengarah ke
   `Solusi Digital Kita-web:80` lewat network `proxy-network`, tidak perlu
   env var di atas.

3. Build & jalankan:
   ```bash
   docker compose up -d --build
   ```

4. Cek status & log:
   ```bash
   docker compose ps
   docker compose logs -f
   ```

### Update konten setelah deploy

Karena `build.js` dijalankan **di dalam image saat build** (bukan di
runtime), setiap kali kamu ubah konten di `source/` (atau translasi,
atau navbar), rebuild image-nya:

```bash
docker compose up -d --build
```

Tidak perlu masuk ke container atau edit file di dalam container
secara manual.

## 11. Requirement

Cuma butuh Node.js terpasang (tanpa `npm install` apa pun, `build.js`
murni pakai modul bawaan Node: `fs` dan `path`). Untuk deploy pakai
Docker, cukup Docker & Docker Compose di VPS -- tidak perlu install
Node.js di host sama sekali (Node cuma dipakai di dalam build stage
Docker image).
