# External Directory

This directory contains raw input data for the Indonesian School PSEO project.

## Structure

- `raw.csv` - Raw school data CSV file (input)

## Expected CSV Format

Place your raw school data in `raw.csv` with the following columns:

```csv
npsn,nama,bentuk_pendidikan,status,provinsi,kab_kota,kecamatan,alamat,lat,lon
"12345678","SMA Negeri 1 Jakarta","SMA","Negeri","DKI Jakarta","Jakarta Pusat","Gambir","Jl. Jend. Sudirman No. 1",-6.2088,106.8456
```

### Required Fields:

- `npsn` - National School ID (numeric)
- `nama` - School name
- `provinsi` - Province
- `kab_kota` - City/Regency
- `kecamatan` - District

### Optional Fields:

- `bentuk_pendidikan` - School type (SD, SMP, SMA, SMK, etc.)
- `status` - School status (Negeri, Swasta)
- `alamat` - Street address
- `lat` - Latitude (decimal degrees)
- `lon` - Longitude (decimal degrees)
- `kelurahan` - Village/sub-district

## Usage

After placing raw data in this directory, run the ETL pipeline:

```bash
npm run etl
```

This will process `raw.csv` and output the cleaned data to `data/schools.csv`.
