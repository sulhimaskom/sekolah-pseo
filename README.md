# Sekolah PSEO

Ini adalah dokumentasi untuk proyek Sekolah PSEO.

## Struktur Direktori

- `src/` - Kode sumber
- `tests/` - File-file tes
- `scripts/` - File-file skrip
- `data/` - File-file data

## Panduan Pengembangan

1. Kloning repositori
2. Instal dependensi: `npm install`
3. Jalankan proses ETL: `npm run etl`
4. Bangun halaman: `npm run build`
5. Hasilkan sitemap: `npm run sitemap`
6. Validasi tautan: `npm run validate-links`

## Skrip yang Tersedia

- `npm run build` - Hasilkan halaman sekolah
- `npm run etl` - Proses data mentah
- `npm run sitemap` - Hasilkan sitemap
- `npm run validate-links` - Validasi tautan internal
- `npm test` - Jalankan semua tes

## Variabel Lingkungan

- `SITE_URL` - URL dasar website untuk pembuatan sitemap (default: https://example.com)
- `RAW_DATA_PATH` - Jalur file data mentah (default: external/raw.csv)
- `VALIDATION_CONCURRENCY_LIMIT` - Batas konkurensi validasi tautan (default: 50)
- `BUILD_CONCURRENCY_LIMIT` - Batas konkurensi pembuatan halaman (default: 100)

## Kontribusi

Kontribusi kode dan dokumentasi dipersilakan.