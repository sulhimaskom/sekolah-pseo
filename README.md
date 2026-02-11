# Sekolah PSEO

Proyek ini adalah platform untuk menampilkan informasi sekolah-sekolah di Indonesia dalam format situs web statis. Proyek ini memproses data sekolah dan menghasilkan halaman web untuk masing-masing sekolah.

## Struktur Direktori

- `src/` - Kode sumber template
- `scripts/` - Script pemrosesan data dan utilitas
- `data/` - File data sekolah (schools.csv)
- `dist/` - Output halaman HTML yang dihasilkan
- `external/` - Data mentah dalam format CSV

## Panduan Pengembangan

1. Kloning repositori
2. Instal dependensi: `npm install`
3. Jalankan proses ETL: `npm run etl`
4. Bangun halaman: `npm run build`
5. Hasilkan sitemap: `npm run sitemap`
6. Validasi tautan: `npm run validate-links`

## Lisensi

ISC
