# Sekolah PSEO

Ini adalah dokumentasi untuk proyek Sekolah PSEO.

## Struktur Direktori

- `src/` - Kode sumber
- `tests/` - File tes
- `scripts/` - File skrip
- `data/` - File data

## Panduan Pengembangan

1. Clone repositori
2. Instal dependensi: `npm install`
3. Jalankan pemrosesan ETL: `npm run etl`
4. Bangun halaman: `npm run build`
5. Hasilkan peta situs: `npm run sitemap`
6. Validasi tautan: `npm run validate-links`

## Skrip yang Tersedia

- `npm run build` - Membangun halaman sekolah
- `npm run etl` - Memproses data mentah
- `npm run sitemap` - Menghasilkan peta situs
- `npm run validate-links` - Memvalidasi tautan internal
- `npm test` - Menjalankan semua tes

## Variabel Lingkungan

- `SITE_URL` - URL dasar situs web, digunakan untuk menghasilkan peta situs (default: https://example.com)
- `RAW_DATA_PATH` - Jalur file data mentah (default: external/raw.csv)
- `VALIDATION_CONCURRENCY_LIMIT` - Batas konkurensi validasi tautan (default: 50)
- `BUILD_CONCURRENCY_LIMIT` - Batas konkurensi pembangunan halaman (default: 100)

## Kontribusi

Kontribusi kode dan dokumentasi sangat diharapkan.