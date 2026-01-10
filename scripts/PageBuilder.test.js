const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { buildSchoolPageData, getUniqueDirectories } = require('../src/services/PageBuilder');

describe('buildSchoolPageData', () => {
  const validSchool = {
    npsn: '12345678',
    nama: 'SD Negeri 1 Jakarta',
    provinsi: 'DKI Jakarta',
    kab_kota: 'Jakarta Pusat',
    kecamatan: 'Menteng',
    alamat: 'Jl. Sudirman No. 1',
    bentuk_pendidikan: 'SD',
    status: 'Negeri'
  };

  it('returns object with relativePath and content properties', () => {
    const result = buildSchoolPageData(validSchool);

    assert.ok(result.hasOwnProperty('relativePath'));
    assert.ok(result.hasOwnProperty('content'));
    assert.strictEqual(typeof result.relativePath, 'string');
    assert.strictEqual(typeof result.content, 'string');
  });

  it('generates correct relative path structure', () => {
    const result = buildSchoolPageData(validSchool);

    assert.ok(result.relativePath.includes('provinsi'));
    assert.ok(result.relativePath.includes('kabupaten'));
    assert.ok(result.relativePath.includes('kecamatan'));
    assert.ok(result.relativePath.includes('.html'));
  });

  it('generates HTML content', () => {
    const result = buildSchoolPageData(validSchool);

    assert.ok(result.content.includes('<!DOCTYPE html>'));
    assert.ok(result.content.includes('</html>'));
  });

  it('throws error for null school object', () => {
    assert.throws(
      () => buildSchoolPageData(null),
      { message: 'Invalid school object provided' }
    );
  });

  it('throws error for undefined school object', () => {
    assert.throws(
      () => buildSchoolPageData(undefined),
      { message: 'Invalid school object provided' }
    );
  });

  it('throws error for string input', () => {
    assert.throws(
      () => buildSchoolPageData('string'),
      { message: 'Invalid school object provided' }
    );
  });

  it('throws error for number input', () => {
    assert.throws(
      () => buildSchoolPageData(123),
      { message: 'Invalid school object provided' }
    );
  });

  it('throws error for array input', () => {
    assert.throws(
      () => buildSchoolPageData([1, 2, 3]),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for school object missing nama field', () => {
    const schoolWithoutNama = { ...validSchool, nama: undefined };

    assert.throws(
      () => buildSchoolPageData(schoolWithoutNama),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for school object missing npsn field', () => {
    const schoolWithoutNpsn = { ...validSchool, npsn: undefined };

    assert.throws(
      () => buildSchoolPageData(schoolWithoutNpsn),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for school object missing provinsi field', () => {
    const schoolWithoutProvinsi = { ...validSchool, provinsi: undefined };

    assert.throws(
      () => buildSchoolPageData(schoolWithoutProvinsi),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for school object missing kab_kota field', () => {
    const schoolWithoutKabKota = { ...validSchool, kab_kota: undefined };

    assert.throws(
      () => buildSchoolPageData(schoolWithoutKabKota),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for school object missing kecamatan field', () => {
    const schoolWithoutKecamatan = { ...validSchool, kecamatan: undefined };

    assert.throws(
      () => buildSchoolPageData(schoolWithoutKecamatan),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for empty string nama field', () => {
    const schoolWithEmptyNama = { ...validSchool, nama: '' };

    assert.throws(
      () => buildSchoolPageData(schoolWithEmptyNama),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for empty string npsn field', () => {
    const schoolWithEmptyNpsn = { ...validSchool, npsn: '' };

    assert.throws(
      () => buildSchoolPageData(schoolWithEmptyNpsn),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for empty string provinsi field', () => {
    const schoolWithEmptyProvinsi = { ...validSchool, provinsi: '' };

    assert.throws(
      () => buildSchoolPageData(schoolWithEmptyProvinsi),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for empty string kab_kota field', () => {
    const schoolWithEmptyKabKota = { ...validSchool, kab_kota: '' };

    assert.throws(
      () => buildSchoolPageData(schoolWithEmptyKabKota),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for empty string kecamatan field', () => {
    const schoolWithEmptyKecamatan = { ...validSchool, kecamatan: '' };

    assert.throws(
      () => buildSchoolPageData(schoolWithEmptyKecamatan),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error listing all missing required fields', () => {
    const schoolWithMultipleMissing = {
      ...validSchool,
      nama: undefined,
      npsn: undefined,
      provinsi: undefined
    };

    assert.throws(
      () => buildSchoolPageData(schoolWithMultipleMissing),
      { message: /School object missing required fields: (nama|npsn|provinsi)(, (nama|npsn|provinsi)){2}/ }
    );
  });

  it('generates correct file path with NPSN and school name', () => {
    const result = buildSchoolPageData(validSchool);

    assert.ok(result.relativePath.includes('12345678'));
    assert.ok(result.relativePath.toLowerCase().includes('sd-negeri-1-jakarta'));
  });

  it('handles Indonesian special characters in location names', () => {
    const schoolWithSpecialChars = {
      ...validSchool,
      provinsi: 'DI Yogyakarta',
      kab_kota: 'Kota Yogyakarta',
      kecamatan: 'Mergangsan'
    };

    const result = buildSchoolPageData(schoolWithSpecialChars);

    assert.ok(result.relativePath.includes('di-yogyakarta'));
    assert.ok(result.relativePath.includes('kota-yogyakarta'));
    assert.ok(result.relativePath.includes('mergangsan'));
  });

  it('handles Indonesian school names with special characters', () => {
    const schoolWithSpecialName = {
      ...validSchool,
      nama: 'SMA Negeri 1 & "Test" School'
    };

    const result = buildSchoolPageData(schoolWithSpecialName);

    assert.ok(result.relativePath.includes('sma-negeri-1-test-school'));
  });

  it('generates correct path structure for all levels', () => {
    const result = buildSchoolPageData(validSchool);

    const parts = result.relativePath.split(path.sep);
    assert.ok(parts.includes('provinsi'));
    assert.ok(parts.includes('kabupaten'));
    assert.ok(parts.includes('kecamatan'));
  });

  it('includes school data in generated HTML content', () => {
    const result = buildSchoolPageData(validSchool);

    assert.ok(result.content.includes('SD Negeri 1 Jakarta'));
    assert.ok(result.content.includes('12345678'));
    assert.ok(result.content.includes('DKI Jakarta'));
  });

  it('allows optional fields to be missing', () => {
    const schoolWithoutOptional = {
      ...validSchool,
      alamat: undefined,
      bentuk_pendidikan: undefined,
      status: undefined
    };

    const result = buildSchoolPageData(schoolWithoutOptional);

    assert.ok(result.relativePath);
    assert.ok(result.content);
  });

  it('generates consistent output for same input', () => {
    const result1 = buildSchoolPageData(validSchool);
    const result2 = buildSchoolPageData(validSchool);

    assert.strictEqual(result1.relativePath, result2.relativePath);
    assert.strictEqual(result1.content, result2.content);
  });

  it('handles whitespace in location names', () => {
    const schoolWithSpaces = {
      ...validSchool,
      provinsi: '  DKI Jakarta  ',
      kab_kota: '  Jakarta Pusat  ',
      kecamatan: '  Menteng  '
    };

    const result = buildSchoolPageData(schoolWithSpaces);

    assert.ok(result.relativePath.includes('dki-jakarta'));
    assert.ok(result.relativePath.includes('jakarta-pusat'));
    assert.ok(result.relativePath.includes('menteng'));
  });

  it('generates valid HTML file extension', () => {
    const result = buildSchoolPageData(validSchool);

    assert.ok(result.relativePath.endsWith('.html'));
  });

  it('includes NPSN prefix in filename', () => {
    const result = buildSchoolPageData(validSchool);

    assert.match(result.relativePath, /\/12345678-.*\.html$/);
  });
});

describe('getUniqueDirectories', () => {
  const validSchool = {
    npsn: '12345678',
    nama: 'SD Negeri 1 Jakarta',
    provinsi: 'DKI Jakarta',
    kab_kota: 'Jakarta Pusat',
    kecamatan: 'Menteng',
    alamat: 'Jl. Sudirman No. 1',
    bentuk_pendidikan: 'SD',
    status: 'Negeri'
  };

  it('returns array of directory paths', () => {
    const result = getUniqueDirectories([validSchool]);

    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 1);
  });

  it('throws error for non-array input', () => {
    assert.throws(
      () => getUniqueDirectories(null),
      { message: 'schools must be an array' }
    );

    assert.throws(
      () => getUniqueDirectories(undefined),
      { message: 'schools must be an array' }
    );

    assert.throws(
      () => getUniqueDirectories('string'),
      { message: 'schools must be an array' }
    );

    assert.throws(
      () => getUniqueDirectories({}),
      { message: 'schools must be an array' }
    );
  });

  it('returns empty array for empty input', () => {
    const result = getUniqueDirectories([]);

    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 0);
  });

  it('generates correct directory structure for single school', () => {
    const result = getUniqueDirectories([validSchool]);

    assert.strictEqual(result.length, 1);
    assert.ok(result[0].includes('provinsi'));
    assert.ok(result[0].includes('kabupaten'));
    assert.ok(result[0].includes('kecamatan'));
    assert.ok(result[0].includes('dki-jakarta'));
    assert.ok(result[0].includes('jakarta-pusat'));
    assert.ok(result[0].includes('menteng'));
  });

  it('returns unique directories for schools in same location', () => {
    const school2 = {
      ...validSchool,
      npsn: '87654321',
      nama: 'SD Negeri 2 Jakarta'
    };

    const result = getUniqueDirectories([validSchool, school2]);

    assert.strictEqual(result.length, 1);
  });

  it('returns multiple directories for schools in different locations', () => {
    const school2 = {
      ...validSchool,
      npsn: '87654321',
      nama: 'SD Negeri 2 Jakarta',
      kecamatan: 'Gambir'
    };

    const result = getUniqueDirectories([validSchool, school2]);

    assert.strictEqual(result.length, 2);
  });

  it('handles schools in different provinces', () => {
    const school2 = {
      ...validSchool,
      npsn: '87654321',
      nama: 'SD Negeri 2 Bandung',
      provinsi: 'Jawa Barat',
      kab_kota: 'Bandung',
      kecamatan: 'Coblong'
    };

    const result = getUniqueDirectories([validSchool, school2]);

    assert.strictEqual(result.length, 2);
    assert.ok(result.some(dir => dir.includes('dki-jakarta')));
    assert.ok(result.some(dir => dir.includes('jawa-barat')));
  });

  it('handles schools in different kabupaten but same province', () => {
    const school2 = {
      ...validSchool,
      npsn: '87654321',
      nama: 'SD Negeri 2 Jakarta',
      kab_kota: 'Jakarta Selatan',
      kecamatan: 'Tebet'
    };

    const result = getUniqueDirectories([validSchool, school2]);

    assert.strictEqual(result.length, 2);
  });

  it('handles schools in different kecamatan but same kabupaten', () => {
    const school2 = {
      ...validSchool,
      npsn: '87654321',
      nama: 'SD Negeri 2 Jakarta',
      kecamatan: 'Gambir'
    };

    const result = getUniqueDirectories([validSchool, school2]);

    assert.strictEqual(result.length, 2);
  });

  it('deduplicates directories correctly', () => {
    const school2 = { ...validSchool, npsn: '87654321', nama: 'SD Negeri 2' };
    const school3 = { ...validSchool, npsn: '11111111', nama: 'SD Negeri 3' };
    const school4 = { ...validSchool, npsn: '22222222', nama: 'SD Negeri 4' };

    const result = getUniqueDirectories([validSchool, school2, school3, school4]);

    assert.strictEqual(result.length, 1);
  });

  it('handles Indonesian special characters in directory names', () => {
    const school = {
      ...validSchool,
      provinsi: 'DI Yogyakarta',
      kab_kota: 'Kota Yogyakarta',
      kecamatan: 'Mergangsan'
    };

    const result = getUniqueDirectories([school]);

    assert.ok(result[0].includes('di-yogyakarta'));
    assert.ok(result[0].includes('kota-yogyakarta'));
    assert.ok(result[0].includes('mergangsan'));
  });

  it('generates directory paths with correct separators', () => {
    const result = getUniqueDirectories([validSchool]);

    const parts = result[0].split(path.sep);
    assert.ok(parts.includes('provinsi'));
    assert.ok(parts.includes('kabupaten'));
    assert.ok(parts.includes('kecamatan'));
  });

  it('handles multiple schools with mixed locations', () => {
    const schools = [
      validSchool,
      { ...validSchool, npsn: '87654321', nama: 'SD 2', kecamatan: 'Gambir' },
      { ...validSchool, npsn: '11111111', nama: 'SD 3', kab_kota: 'Jakarta Selatan', kecamatan: 'Tebet' },
      { ...validSchool, npsn: '22222222', nama: 'SD 4', provinsi: 'Jawa Barat', kab_kota: 'Bandung', kecamatan: 'Coblong' }
    ];

    const result = getUniqueDirectories(schools);

    assert.strictEqual(result.length, 4);
  });

  it('returns unique array (no duplicates)', () => {
    const school2 = { ...validSchool, npsn: '87654321', nama: 'SD Negeri 2' };

    const result = getUniqueDirectories([validSchool, school2]);

    const uniqueSet = new Set(result);
    assert.strictEqual(result.length, uniqueSet.size);
  });

  it('handles whitespace in location names', () => {
    const school = {
      ...validSchool,
      provinsi: '  DKI Jakarta  ',
      kab_kota: '  Jakarta Pusat  ',
      kecamatan: '  Menteng  '
    };

    const result = getUniqueDirectories([school]);

    assert.ok(result[0].includes('dki-jakarta'));
    assert.ok(result[0].includes('jakarta-pusat'));
    assert.ok(result[0].includes('menteng'));
  });

  it('generates consistent directory paths', () => {
    const result1 = getUniqueDirectories([validSchool]);
    const result2 = getUniqueDirectories([validSchool]);

    assert.deepStrictEqual(result1, result2);
  });

  it('maintains array order consistency', () => {
    const schools = [
      validSchool,
      { ...validSchool, npsn: '87654321', nama: 'SD 2', kecamatan: 'Gambir' },
      { ...validSchool, npsn: '11111111', nama: 'SD 3', kab_kota: 'Jakarta Selatan', kecamatan: 'Tebet' }
    ];

    const result1 = getUniqueDirectories(schools);
    const result2 = getUniqueDirectories(schools);

    assert.deepStrictEqual(result1, result2);
  });

  it('handles large number of schools efficiently', () => {
    const schools = [];
    for (let i = 0; i < 100; i++) {
      schools.push({
        ...validSchool,
        npsn: `${10000000 + i}`,
        nama: `SD Negeri ${i + 1}`,
        kecamatan: `Kecamatan ${i % 10}`
      });
    }

    const result = getUniqueDirectories(schools);

    assert.ok(result.length <= 10);
  });
});
