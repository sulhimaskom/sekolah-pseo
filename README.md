# Sekolah PSEO

Proyek ini adalah platform untuk menampilkan informasi sekolah-sekolah di Indonesia dalam format situs web statis. Proyek ini memproses data sekolah dan menghasilkan halaman web untuk masing-masing sekolah.

## Struktur Direktori

- `src/` - Kode sumber template
- `scripts/` - Script pemrosesan data dan utilitas
- `data/` - File data sekolah (schools.csv)

## Panduan Pengembangan

1. Clone repositori
2. Instal dependensi: `npm install`
3. Proses data sekolah: `npm run etl`
4. Bangun halaman: `npm run build`
5. Generate sitemap: `npm run sitemap`
6. Validasi tautan: `npm run validate-links`

## Script yang Tersedia

- `npm run build` - Membangun halaman sekolah
- `npm run etl` - Memproses data sekolah dari sumber eksternal
- `npm run sitemap` - Membuat file sitemap untuk SEO
- `npm run validate-links` - Memvalidasi tautan internal
- `npm test` - Menjalankan semua tes

## Variabel Lingkungan

- `SITE_URL` - URL dasar situs web, digunakan untuk membuat sitemap (default: https://example.com)
- `RAW_DATA_PATH` - Lokasi file data sekolah (default: external/raw.csv)
- `VALIDATION_CONCURRENCY_LIMIT` - Batas konkurensi untuk validasi tautan (default: 50)
- `BUILD_CONCURRENCY_LIMIT` - Batas konkurensi untuk pembuatan halaman (default: 100)

## Kontribusi

Kami menyambut kontribusi dalam bentuk kode maupun dokumentasi. Silakan buat issue atau pull request untuk berkontribusi.