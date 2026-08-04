# F029 — fetch-data.test.js corrupts tracked `external/raw.csv` (NEW, 37th run)

**Evaluation Date**: 2026-08-04 (37th run)
**Category**: test
**Priority**: P1
**Status**: OPEN — NEW (first observed 37th run)

## Summary

A unit test in `scripts/fetch-data.test.js` ("handles fetch error gracefully when
cached fallback succeeds") mutates the **tracked repository file
`external/raw.csv`** during `npm run test:js`. When the simulated fetch fails, the
`useCachedData → copyToRaw` fallback copies the test fixture
(`external-data/sekolah.csv`, content `col1\nval1`) over the real raw data file,
destroying its content.

## Observed evidence (this run)

Run 1 of `npm run test:js` executed the failing path and `git status` afterwards
showed:

```
 M external/raw.csv
```

Diff confirmed the corruption:

```
-npsn,nama,bentuk_pendidikan,status,provinsi,kab_kota,kecamatan,alamat,lat,lon
-12345678,SMA Negeri 1 Jakarta,SMA,Negeri,DKI Jakarta,Jakarta Pusat,Gambir,Jl. Jend. Sudirman No. 1,-6.2088,106.8456
-87654321,SD Negeri 2 Bandung,SD,Negeri,Jawa Barat,Kota Bandung,Cicendo,Jl. Asia Afrika No. 2,-6.9175,107.6191
+col1
+val1
```

The `col1\nval1` payload originates from the test fixture
`fs.writeFileSync(path.join(externalDataDir, 'sekolah.csv'), 'col1\nval1')`
(`scripts/fetch-data.test.js:511`). File restored from git (clean).

## Root cause

`scripts/fetch-data.test.js:495–514` invokes `main()` **without** `--output`,
so `main()` uses `CONFIG.RAW_DATA_PATH` which defaults to the real
`external/raw.csv` (`scripts/config.js:32–36`). The fallback chain
`useCachedData(destPath)` → `copyToRaw(csvFiles[0], destPath)` performs
`fs.copyFileSync` over the real file. The test only isolates its own _input_
fixtures (temp dirs), not the _output_ destination.

The corruption is one-shot: after the first overwrite, `fs.existsSync(destPath)`
succeeds on subsequent runs ("Falling back to cached data at external/raw.csv"),
which is why only run 1 of 5 showed the modification — the test passes silently
with corrupted data thereafter.

## Impact / Risk

- **Data integrity**: `npm run test:js` can destroy tracked source data
  (`external/raw.csv`) — the ETL input. If committed, downstream `npm run etl`
  would load garbage.
- Related to the F014 family: filesystem side effects not isolated per-suite.
- Silently passes after corrupting — no test failure signals the damage.

## Suggested resolution

- Pass an isolated `--output <tmpDir>/raw.csv` to `main()` in the test, or
- Monkeypatch `CONFIG.RAW_DATA_PATH` (and `EXTERNAL_DIR`) to a temp dir for the
  duration of the test, restoring afterwards (mirror `scripts/etl.test.js:349–359`).
- Add a regression assertion that `external/raw.csv` is untouched after the suite.

## Affected

`scripts/fetch-data.test.js` (test "handles fetch error gracefully when cached
fallback succeeds", ~line 495); `scripts/config.js` (default raw path)
