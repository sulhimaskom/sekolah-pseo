# Sekolah PSEO

Sekolah PSEO adalah platform untuk menampilkan informasi sekolah-sekolah di Indonesia dalam format situs web statis. Proyek ini memproses data sekolah dan menghasilkan halaman web untuk masing-masing sekolah.

## Fitur Utama

### 1. ETL (Extract, Transform, Load)

Proses ETL mengekstrak data dari sumber eksternal (CSV), mentransformasi format data, dan memuat ke file `schools.csv` yang terstruktur.

### 2. Pembuatan Halaman Sekolah

Membuat halaman HTML statis untuk setiap sekolah dengan informasi lengkap meliputi:

- Identitas sekolah (nama, NPSN, bentuk pendidikan, status)
- Lokasi (alamat, kelurahan, kecamatan, kabupaten/kota, provinsi)
- Koordinat geografis (latitude, longitude)

### 3. Halaman Provinsi

Membuat halaman indeks per provinsi yang menampilkan semua kabupaten/kota dalam provinsi tersebut beserta jumlah sekolah.

### 4. Halaman Utama

Halaman utama dengan fungsionalitas:

- Pencarian sekolah berdasarkan nama
- Filter berdasarkan provinsi
- Filter berdasarkan jenis pendidikan
- Navigasi cepat ke halaman provinsi

### 5. Peta Situs (Sitemap)

Menghasilkan sitemap XML yang memenuhi standar Google (maksimum 50.000 URL per file).

### 6. Validasi Tautan

Memvalidasi semua tautan internal dalam file HTML yang dihasilkan untuk memastikan tidak ada tautan rusak.

### 7. Build Inkremental

Mendukung build inkremental menggunakan manifest untuk melewati halaman yang tidak berubah sejak build terakhir.

### 8. Pengecekkan Kesegaran Data

Memeriksa usia data sekolah dan menghasilkan laporan kualitas data.

## Alur Data

```
external/raw.csv → ETL Process → data/schools.csv → Build Process → dist/
                                                                    ├── index.html (Homepage)
                                                                    ├── Provinsi/
                                                                    │   └── {province}/index.html
                                                                    ├── {path}/{npsn}-{slug}.html (School pages)
                                                                    └── styles.css
                                        Sitemap Generator → dist/sitemap-index.xml
                                        Link Validator → Validation Report
```

## npm Scripts

| Command                           | Description                                    |
| --------------------------------- | ---------------------------------------------- |
| `npm run dev`                     | Jalankan lint dan test JavaScript              |
| `npm run build`                   | Bangun semua halaman sekolah (full build)      |
| `npm run build:incremental`       | Build inkremental (hanya halaman berubah)      |
| `npm run etl`                     | Jalankan proses ETL (ekstrak, transform, load) |
| `npm run fetch-data`              | Ambil data sekolah dari sumber eksternal       |
| `npm run sitemap`                 | Hasilkan file sitemap XML                      |
| `npm run validate-links`          | Validasi semua tautan internal                 |
| `npm run check-freshness`         | Periksa kesegaran data sekolah                 |
| `npm run freshness-report`        | Hasilkan laporan kesegaran data detail         |
| `npm run data-quality`            | Periksa kualitas data sekolah                  |
| `npm run data-quality:json`       | Periksa kualitas data dengan output JSON       |
| `npm run lint`                    | Jalankan ESLint untuk kode                     |
| `npm run format`                  | Format kode dengan Prettier                    |
| `npm run format:check`            | Periksa format kode tanpa mengubah             |
| `npm run test`                    | Jalankan semua test (JS + Python)              |
| `npm run test:js`                 | Jalankan test JavaScript                       |
| `npm run test:js:coverage`        | Jalankan test dengan coverage check            |
| `npm run test:js:coverage:report` | Hasilkan laporan coverage HTML                 |
| `npm run test:py`                 | Jalankan test Python                           |
| `npm run test:py:pytest`          | Jalankan test Python dengan pytest             |
| `npm run test:all`                | Jalankan semua test (JS + Python via pytest)   |
| `npm run test:ci`                 | Jalankan test untuk CI pipeline                |
| `npm run cli`                     | Jalankan menu CLI interaktif                   |
| `npm run coverage`                | Cek coverage (minimum 80% lines, 75% branches) |
| `npm run coverage:report`         | Hasilkan laporan coverage detail               |

## Panduan Pengembangan

### Persiapan

1. Kloning repositori:

   ```bash
   git clone https://github.com/sulhimaskom/sekolah-pseo.git
   cd sekolah-pseo
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

### Pengembangan Harian

1. Jalankan proses ETL untuk memperbarui data:

   ```bash
   npm run etl
   ```

2. Bangun halaman:

   ```bash
   npm run build
   ```

3. Hasilkan sitemap:

   ```bash
   npm run sitemap
   ```

4. Validasi tautan:
   ```bash
   npm run validate-links
   ```

### Build Inkremental

Build inkremental hanya memproses halaman yang berubah sejak build terakhir:

```bash
npm run build:incremental
```

Untuk full build (semua halaman):

```bash
npm run build
```

Sistem menggunakan file manifest (`manifest.json`) untuk melacak perubahan — halaman yang tidak berubah akan dilewati secara otomatis.

### Pengecekkan Kesegaran Data

Untuk memeriksa apakah data sudah segar:

```bash
node scripts/check-freshness.js
```

Untuk output JSON:

```bash
node scripts/check-freshness.js --json
```

Untuk verbose output dengan metrik kualitas:

```bash
node scripts/check-freshness.js --verbose
```

### Menu CLI Interaktif

Untuk kemudahan penggunaan, tersedia menu CLI interaktif:

```bash
npm run cli
```

Menu ini menyediakan akses cepat ke semua perintah umum:

- **Development**: Menjalankan lint dan test
- **Data Pipeline**: ETL, fetch data, pengecekkan kesegaran data
- **Testing**: Semua test, JavaScript, Python, atau dengan coverage
- **Validation**: Validasi tautan dan generate sitemap
- **Utilities**: Lint dan format kode

Menu ini berfungsi secara interaktif di terminal dan akan menampilkan daftar perintah jika dijalankan di lingkungan non-interaktif (CI).

## Struktur Direktori

```
sekolah-pseo/
├── .github/
│   └── workflows/          # GitHub Actions workflows
├── dist/                   # Output halaman HTML yang dihasilkan
├── data/                   # File data sekolah (schools.csv)
├── external/               # Data mentah dalam format CSV
├── public/                # Asset statis (favicon, dll)
├── scripts/               # Script pemrosesan data dan utilitas
│   ├── build-pages.js     # Halaman pembangunan
│   ├── check-freshness.js # Pengecekkan kesegaran data
│   ├── config.js          # Konfigurasi
│   ├── etl.js            # Proses ETL
│   ├── fetch-data.js      # Pengambilan data eksternal
│   ├── fs-safe.js        # File system wrapper aman
│   ├── logger.js         # Logging
│   ├── manifest.js       # Build manifest
│   ├── rate-limiter.js   # Rate limiting
│   ├── resilience.js     # Pola resilience
│   ├── sitemap.js       # Peta situs
│   ├── slugify.js       # URL slug
│   ├── utils.js         # Utilitas
│   └── validate-links.js # Validasi tautan
├── src/
│   ├── presenters/
│   │   ├── design-system.js  # Design tokens
│   │   ├── styles.js        # CSS generator
│   │   └── templates/      # Template HTML
│   │       ├── homepage.js
│   │       ├── province-page.js
│   │       ├── school-page.js
│   │       └── shared/
│   │           ├── head-meta.js    # Shared HTML head prefix
│   │           └── back-to-top.js  # Shared back-to-top button
│   └── services/
│       └── PageBuilder.js   # Halaman builder service
├── tests/                 # Test Python
├── docs/                  # Dokumentasi
├── CONTRIBUTING.md       # Panduan kontribusi
├── SECURITY.md           # Keamanan
└── package.json
```

## Pengujian

Proyek ini mencakup pengujian untuk memverifikasi pipeline CI/CD:

### Test JavaScript

Jalankan test JavaScript:

```bash
npm run test:js
```

Dengan coverage:

```bash
npm run test:js:coverage
```

### Test Python

Jalankan test Python:

```bash
npm run test:py
```

### Semua Test

Jalankan semua test:

```bash
npm test
```

## Konfigurasi Git

Repositori ini menggunakan `.gitignore` yang telah dikonfigurasi untuk mencegah commit file sensitif:

### File yang Dikecualikan

- **Environment files**: `.env`, `.env.local`, `.env.*.local`
- **Node.js**: `node_modules/`, `.npm`, `.eslintcache`
- **Logs**: `*.log`, `npm-debug.log*`, `yarn-debug.log*`
- **IDE**: `.idea/`, `.vscode/`, `*.swp`, `*.swo`
- **OS**: `.DS_Store`, `Thumbs.db`
- **Build outputs**: `dist/`, `build/`, `coverage/`

### CI Verification

Setiap push ke branch `main` dan pull request yang mengubah `.gitignore` akan diverifikasi oleh workflow `gitignore-check` yang:

1. Memastikan pola kritis ada di `.gitignore`
2. Memeriksa pola file sensitif umum
3. Memverifikasi tidak ada file rahasia yang akan ter-commit

## Dokumentasi Lanjutan

- [Dokumentasi API](docs/api.md) - Dokumentasi API lengkap untuk semua modul
- [Panduan Kontribusi](CONTRIBUTING.md) - Cara berkontribusi pada proyek
- [Keamanan](SECURITY.md) - Kebijakan keamanan
- [Dokumentasi Deployment](docs/deployment.md) - Panduan deployment

## Lisensi

ISC
