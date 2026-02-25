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

## Menu Interaktif CLI

Proyek ini menyediakan menu interaktif untuk memudahkan menjalankan tugas-tugas umum:

```bash
npm run interactive
```

Menu ini menyediakan opsi berikut:

| Opsi           | Deskripsi                                                  |
| -------------- | ---------------------------------------------------------- |
| ETL            | Jalankan pipeline pemrosesan data                          |
| Build          | Hasilkan halaman statis                                    |
| Sitemap        | Hasilkan file sitemap.xml                                  |
| Validate Links | Periksa tautan yang rusak                                  |
| Test           | Jalankan semua pengujian                                   |
| All            | Jalankan urutan lengkap (ETL → Build → Sitemap → Validate) |
| Help           | Tampilkan informasi penggunaan                             |
| Exit           | Keluar dari menu                                           |

Alternatifnya, Anda dapat menjalankan perintah langsung:

```bash
npm run etl           # Jalankan ETL
npm run build         # Bangun halaman
npm run sitemap       # Hasilkan sitemap
npm run validate-links # Validasi tautan
npm run test          # Jalankan pengujian
npm run lint          # Jalankan linter
npm run format        # Format kode
```

## Pengujian

Proyek ini mencakup fungsi pengujian sederhana untuk memverifikasi pipeline CI/CD:

- `addNumbers(a, b)` - Fungsi utilitas untuk menjumlahkan dua angka (terletak di `scripts/utils.js`)

Jalankan pengujian dengan: `npm test`

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

## Lisensi

ISC
