# Sekolah PSEO

Ini adalah dokumentasi untuk proyek Sekolah PSEO.

## Struktur Direktori

- `src/` - Kode sumber
- `tests/` - File tes
- `scripts/` - File skrip
- `data/` - File data

## Panduan Pengembangan

1. Kloning repositori
2. Instal dependensi: `npm install`
3. Jalankan pemrosesan ETL: `npm run etl`
4. Bangun halaman: `npm run build`
5. Hasilkan peta situs: `npm run sitemap`
6. Validasi tautan: `npm run validate-links`

## Skrip yang Tersedia

- `npm run build` - Hasilkan halaman sekolah
- `npm run etl` - Proses data mentah
- `npm run sitemap` - Hasilkan peta situs
- `npm run validate-links` - Validasi tautan internal
- `npm test` - Jalankan semua tes

## Variabel Lingkungan

- `SITE_URL` - URL dasar situs web, untuk menghasilkan peta situs (bawaan: https://example.com)
- `RAW_DATA_PATH` - Jalur file data mentah (bawaan: external/raw.csv)
- `VALIDATION_CONCURRENCY_LIMIT` - Batas konkurensi validasi tautan (bawaan: 50)
- `BUILD_CONCURRENCY_LIMIT` - Batas konkurensi pembuatan halaman (bawaan: 100)

## Kontribusi

Kontribusi kode dan dokumentasi dipersilakan.