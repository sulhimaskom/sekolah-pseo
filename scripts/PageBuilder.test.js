const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const {
  buildSchoolPageData,
  getUniqueDirectories,
  getUniqueProvinces,
  buildProvincePageData,
  groupSchoolsByProvince,
  prepareSchoolDataForSearch,
} = require('../src/services/PageBuilder');

describe('buildSchoolPageData', () => {
  const validSchool = {
    npsn: '12345678',
    nama: 'SD Negeri 1 Jakarta',
    provinsi: 'DKI Jakarta',
    kab_kota: 'Jakarta Pusat',
    kecamatan: 'Menteng',
    alamat: 'Jl. Sudirman No. 1',
    bentuk_pendidikan: 'SD',
    status: 'Negeri',
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
    assert.throws(() => buildSchoolPageData(null), { message: 'Invalid school object provided' });
  });

  it('throws error for undefined school object', () => {
    assert.throws(() => buildSchoolPageData(undefined), {
      message: 'Invalid school object provided',
    });
  });

  it('throws error for string input', () => {
    assert.throws(() => buildSchoolPageData('string'), {
      message: 'Invalid school object provided',
    });
  });

  it('throws error for number input', () => {
    assert.throws(() => buildSchoolPageData(123), { message: 'Invalid school object provided' });
  });

  it('throws error for array input', () => {
    assert.throws(() => buildSchoolPageData([1, 2, 3]), {
      message: /School object missing required fields/,
    });
  });

  it('throws error for school object missing nama field', () => {
    const schoolWithoutNama = { ...validSchool, nama: undefined };

    assert.throws(() => buildSchoolPageData(schoolWithoutNama), {
      message: /School object missing required fields/,
    });
  });

  it('throws error for school object missing npsn field', () => {
    const schoolWithoutNpsn = { ...validSchool, npsn: undefined };

    assert.throws(() => buildSchoolPageData(schoolWithoutNpsn), {
      message: /School object missing required fields/,
    });
  });

  it('throws error for school object missing provinsi field', () => {
    const schoolWithoutProvinsi = { ...validSchool, provinsi: undefined };

    assert.throws(() => buildSchoolPageData(schoolWithoutProvinsi), {
      message: /School object missing required fields/,
    });
  });

  it('throws error for school object missing kab_kota field', () => {
    const schoolWithoutKabKota = { ...validSchool, kab_kota: undefined };

    assert.throws(() => buildSchoolPageData(schoolWithoutKabKota), {
      message: /School object missing required fields/,
    });
  });

  it('throws error for school object missing kecamatan field', () => {
    const schoolWithoutKecamatan = { ...validSchool, kecamatan: undefined };

    assert.throws(() => buildSchoolPageData(schoolWithoutKecamatan), {
      message: /School object missing required fields/,
    });
  });

  it('throws error for empty string nama field', () => {
    const schoolWithEmptyNama = { ...validSchool, nama: '' };

    assert.throws(() => buildSchoolPageData(schoolWithEmptyNama), {
      message: /School object missing required fields/,
    });
  });

  it('throws error for empty string npsn field', () => {
    const schoolWithEmptyNpsn = { ...validSchool, npsn: '' };

    assert.throws(() => buildSchoolPageData(schoolWithEmptyNpsn), {
      message: /School object missing required fields/,
    });
  });

  it('throws error for empty string provinsi field', () => {
    const schoolWithEmptyProvinsi = { ...validSchool, provinsi: '' };

    assert.throws(() => buildSchoolPageData(schoolWithEmptyProvinsi), {
      message: /School object missing required fields/,
    });
  });

  it('throws error for empty string kab_kota field', () => {
    const schoolWithEmptyKabKota = { ...validSchool, kab_kota: '' };

    assert.throws(() => buildSchoolPageData(schoolWithEmptyKabKota), {
      message: /School object missing required fields/,
    });
  });

  it('throws error for empty string kecamatan field', () => {
    const schoolWithEmptyKecamatan = { ...validSchool, kecamatan: '' };

    assert.throws(() => buildSchoolPageData(schoolWithEmptyKecamatan), {
      message: /School object missing required fields/,
    });
  });

  it('throws error listing all missing required fields', () => {
    const schoolWithMultipleMissing = {
      ...validSchool,
      nama: undefined,
      npsn: undefined,
      provinsi: undefined,
    };

    assert.throws(() => buildSchoolPageData(schoolWithMultipleMissing), {
      message:
        /School object missing required fields: (nama|npsn|provinsi)(, (nama|npsn|provinsi)){2}/,
    });
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
      kecamatan: 'Mergangsan',
    };

    const result = buildSchoolPageData(schoolWithSpecialChars);

    assert.ok(result.relativePath.includes('di-yogyakarta'));
    assert.ok(result.relativePath.includes('kota-yogyakarta'));
    assert.ok(result.relativePath.includes('mergangsan'));
  });

  it('handles Indonesian school names with special characters', () => {
    const schoolWithSpecialName = {
      ...validSchool,
      nama: 'SMA Negeri 1 & "Test" School',
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
      status: undefined,
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
      kecamatan: '  Menteng  ',
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
    status: 'Negeri',
  };

  it('returns array of directory paths', () => {
    const result = getUniqueDirectories([validSchool]);

    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 1);
  });

  it('throws error for non-array input', () => {
    assert.throws(() => getUniqueDirectories(null), { message: 'schools must be an array' });

    assert.throws(() => getUniqueDirectories(undefined), { message: 'schools must be an array' });

    assert.throws(() => getUniqueDirectories('string'), { message: 'schools must be an array' });

    assert.throws(() => getUniqueDirectories({}), { message: 'schools must be an array' });
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
      nama: 'SD Negeri 2 Jakarta',
    };

    const result = getUniqueDirectories([validSchool, school2]);

    assert.strictEqual(result.length, 1);
  });

  it('returns multiple directories for schools in different locations', () => {
    const school2 = {
      ...validSchool,
      npsn: '87654321',
      nama: 'SD Negeri 2 Jakarta',
      kecamatan: 'Gambir',
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
      kecamatan: 'Coblong',
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
      kecamatan: 'Tebet',
    };

    const result = getUniqueDirectories([validSchool, school2]);

    assert.strictEqual(result.length, 2);
  });

  it('handles schools in different kecamatan but same kabupaten', () => {
    const school2 = {
      ...validSchool,
      npsn: '87654321',
      nama: 'SD Negeri 2 Jakarta',
      kecamatan: 'Gambir',
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
      kecamatan: 'Mergangsan',
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
      {
        ...validSchool,
        npsn: '11111111',
        nama: 'SD 3',
        kab_kota: 'Jakarta Selatan',
        kecamatan: 'Tebet',
      },
      {
        ...validSchool,
        npsn: '22222222',
        nama: 'SD 4',
        provinsi: 'Jawa Barat',
        kab_kota: 'Bandung',
        kecamatan: 'Coblong',
      },
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
      kecamatan: '  Menteng  ',
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
      {
        ...validSchool,
        npsn: '11111111',
        nama: 'SD 3',
        kab_kota: 'Jakarta Selatan',
        kecamatan: 'Tebet',
      },
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
        kecamatan: `Kecamatan ${i % 10}`,
      });
    }

    const result = getUniqueDirectories(schools);

    assert.ok(result.length <= 10);
  });
});

describe('buildProvincePageData', () => {
  it('throws error for empty string province name', () => {
    assert.throws(() => buildProvincePageData('', []), {
      message: 'Invalid province name provided',
    });
  });

  it('throws error for null province name', () => {
    assert.throws(() => buildProvincePageData(null, []), {
      message: 'Invalid province name provided',
    });
  });

  it('throws error for undefined province name', () => {
    assert.throws(() => buildProvincePageData(undefined, []), {
      message: 'Invalid province name provided',
    });
  });

  it('throws error for number province name', () => {
    assert.throws(() => buildProvincePageData(123, []), {
      message: 'Invalid province name provided',
    });
  });

  it('throws error for object province name', () => {
    assert.throws(() => buildProvincePageData({ name: 'Test' }, []), {
      message: 'Invalid province name provided',
    });
  });

  it('throws error for non-array schools (null)', () => {
    assert.throws(() => buildProvincePageData('Jawa Barat', null), {
      message: 'schools must be an array',
    });
  });

  it('throws error for non-array schools (string)', () => {
    assert.throws(() => buildProvincePageData('Jawa Barat', 'not-an-array'), {
      message: 'schools must be an array',
    });
  });

  it('throws error for non-array schools (object)', () => {
    assert.throws(() => buildProvincePageData('Jawa Barat', { school: 'data' }), {
      message: 'schools must be an array',
    });
  });

  it('returns object with relativePath and content for valid inputs', () => {
    const result = buildProvincePageData('Jawa Barat', []);

    assert.ok(result.hasOwnProperty('relativePath'));
    assert.ok(result.hasOwnProperty('content'));
    assert.strictEqual(typeof result.relativePath, 'string');
    assert.strictEqual(typeof result.content, 'string');
  });

  it('generates correct relative path structure for province', () => {
    const result = buildProvincePageData('DKI Jakarta', []);

    assert.ok(result.relativePath.includes('provinsi'));
    assert.ok(result.relativePath.includes('dki-jakarta'));
    assert.ok(result.relativePath.includes('index.html'));
  });

  it('passes skipFilter parameter to template', () => {
    const resultWithSkip = buildProvincePageData('Jawa Barat', [], true);
    const resultWithoutSkip = buildProvincePageData('Jawa Barat', [], false);

    assert.ok(resultWithSkip.content);
    assert.ok(resultWithoutSkip.content);
  });
});

describe('groupSchoolsByProvince', () => {
  it('returns empty Map for null input', () => {
    const result = groupSchoolsByProvince(null);

    assert.ok(result instanceof Map);
    assert.strictEqual(result.size, 0);
  });

  it('returns empty Map for undefined input', () => {
    const result = groupSchoolsByProvince(undefined);

    assert.ok(result instanceof Map);
    assert.strictEqual(result.size, 0);
  });

  it('returns empty Map for object input', () => {
    const result = groupSchoolsByProvince({});

    assert.ok(result instanceof Map);
    assert.strictEqual(result.size, 0);
  });

  it('returns empty Map for empty array', () => {
    const result = groupSchoolsByProvince([]);

    assert.ok(result instanceof Map);
    assert.strictEqual(result.size, 0);
  });

  it('skips schools without provinsi field', () => {
    const schools = [
      { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat' },
      { npsn: '2', nama: 'School 2' },
      { npsn: '3', nama: 'School 3', provinsi: null },
      { npsn: '4', nama: 'School 4', provinsi: '' },
    ];

    const result = groupSchoolsByProvince(schools);

    assert.strictEqual(result.size, 1);
    assert.ok(result.has('Jawa Barat'));
    assert.strictEqual(result.get('Jawa Barat').length, 1);
  });

  it('groups schools from same province together', () => {
    const schools = [
      { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat' },
      { npsn: '2', nama: 'School 2', provinsi: 'Jawa Barat' },
      { npsn: '3', nama: 'School 3', provinsi: 'Jawa Timur' },
    ];

    const result = groupSchoolsByProvince(schools);

    assert.strictEqual(result.size, 2);
    assert.strictEqual(result.get('Jawa Barat').length, 2);
    assert.strictEqual(result.get('Jawa Timur').length, 1);
  });

  it('returns Map with correct province keys', () => {
    const schools = [
      { npsn: '1', nama: 'School 1', provinsi: 'Bali' },
      { npsn: '2', nama: 'School 2', provinsi: 'Aceh' },
      { npsn: '3', nama: 'School 3', provinsi: 'Papua' },
    ];

    const result = groupSchoolsByProvince(schools);

    assert.strictEqual(result.size, 3);
    assert.ok(result.has('Bali'));
    assert.ok(result.has('Aceh'));
    assert.ok(result.has('Papua'));
  });
});

describe('getUniqueProvinces', () => {
  it('throws IntegrationError for null input', () => {
    assert.throws(() => getUniqueProvinces(null), { name: 'IntegrationError' });
  });

  it('throws IntegrationError for undefined input', () => {
    assert.throws(() => getUniqueProvinces(undefined), { name: 'IntegrationError' });
  });

  it('throws IntegrationError for string input', () => {
    assert.throws(() => getUniqueProvinces('invalid'), { name: 'IntegrationError' });
  });

  it('throws IntegrationError for object input', () => {
    assert.throws(() => getUniqueProvinces({}), { name: 'IntegrationError' });
  });

  it('returns empty array for empty schools list', () => {
    const result = getUniqueProvinces([]);

    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 0);
  });

  it('returns unique provinces with correct structure', () => {
    const schools = [
      { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat' },
      { npsn: '2', nama: 'School 2', provinsi: 'Jawa Timur' },
    ];

    const result = getUniqueProvinces(schools);

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].name, 'Jawa Barat');
    assert.ok(typeof result[0].slug === 'string');
    assert.strictEqual(result[0].slug, 'jawa-barat');
    assert.strictEqual(result[0].count, 1);
  });

  it('counts schools per province correctly', () => {
    const schools = [
      { npsn: '1', nama: 'School 1', provinsi: 'Jawa Barat' },
      { npsn: '2', nama: 'School 2', provinsi: 'Jawa Barat' },
      { npsn: '3', nama: 'School 3', provinsi: 'Jawa Timur' },
    ];

    const result = getUniqueProvinces(schools);

    assert.strictEqual(result.length, 2);
    const jabar = result.find(p => p.name === 'Jawa Barat');
    const jatim = result.find(p => p.name === 'Jawa Timur');
    assert.strictEqual(jabar.count, 2);
    assert.strictEqual(jatim.count, 1);
  });

  it('skips schools without provinsi field', () => {
    const schools = [
      { npsn: '1', nama: 'School 1', provinsi: 'Bali' },
      { npsn: '2', nama: 'School 2' },
      { npsn: '3', nama: 'School 3', provinsi: null },
      { npsn: '4', nama: 'School 4', provinsi: '' },
    ];

    const result = getUniqueProvinces(schools);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].name, 'Bali');
  });

  it('generates correct slugs for multi-word provinces', () => {
    const schools = [
      { npsn: '1', nama: 'School 1', provinsi: 'DKI Jakarta' },
      { npsn: '2', nama: 'School 2', provinsi: 'Kepulauan Riau' },
    ];

    const result = getUniqueProvinces(schools);

    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].slug, 'dki-jakarta');
    assert.strictEqual(result[1].slug, 'kepulauan-riau');
    assert.strictEqual(result[0].count, 1);
    assert.strictEqual(result[1].count, 1);
  });
});

describe('prepareSchoolDataForSearch', () => {
  it('returns empty array for null input', () => {
    assert.deepStrictEqual(prepareSchoolDataForSearch(null), []);
  });

  it('returns empty array for undefined input', () => {
    assert.deepStrictEqual(prepareSchoolDataForSearch(undefined), []);
  });

  it('returns empty array for string input', () => {
    assert.deepStrictEqual(prepareSchoolDataForSearch('invalid'), []);
  });

  it('returns empty array for object input', () => {
    assert.deepStrictEqual(prepareSchoolDataForSearch({}), []);
  });

  it('returns empty array for empty schools array', () => {
    assert.deepStrictEqual(prepareSchoolDataForSearch([]), []);
  });

  it('returns flat arrays with correct structure for valid schools', () => {
    const schools = [
      {
        npsn: '12345678',
        nama: 'SD Negeri 1 Jakarta',
        bentuk_pendidikan: 'SD',
        status: 'N',
        alamat: 'Jl. Sudirman No. 1',
        kecamatan: 'Menteng',
        kab_kota: 'Jakarta Pusat',
        provinsi: 'DKI Jakarta',
      },
    ];

    const result = prepareSchoolDataForSearch(schools);

    assert.strictEqual(result.length, 1);
    assert.ok(Array.isArray(result[0]));
    assert.strictEqual(result[0].length, 9);

    // Verify flat array format: [npsn, nama, bentuk, status, alamat, kecamatan, kab_kota, provinsi, url]
    assert.strictEqual(result[0][0], '12345678');
    assert.strictEqual(result[0][1], 'SD Negeri 1 Jakarta');
    assert.strictEqual(result[0][2], 'SD');
    assert.strictEqual(result[0][3], 'N');
    assert.strictEqual(result[0][4], 'Jl. Sudirman No. 1');
    assert.strictEqual(result[0][5], 'Menteng');
    assert.strictEqual(result[0][6], 'Jakarta Pusat');
    assert.strictEqual(result[0][7], 'DKI Jakarta');
    assert.ok(result[0][8].startsWith('/'));
    assert.ok(result[0][8].includes('12345678'));
  });

  it('defaults missing fields to empty strings', () => {
    const schools = [
      {
        npsn: '87654321',
        nama: 'SMA Negeri 1',
        provinsi: 'Jawa Barat',
        kab_kota: 'Bandung',
        kecamatan: 'Coblong',
      },
    ];

    const result = prepareSchoolDataForSearch(schools);

    assert.strictEqual(result[0][2], '');
    assert.strictEqual(result[0][3], '');
    assert.strictEqual(result[0][4], '');
  });

  it('handles school objects with missing optional fields', () => {
    const schools = [
      {
        npsn: '12345678',
        nama: 'Test School',
        provinsi: 'DKI Jakarta',
        kab_kota: 'Jakarta Pusat',
        kecamatan: 'Menteng',
      },
    ];
    const result = prepareSchoolDataForSearch(schools);
    // Optional fields like bentuk_pendidikan, status, alamat default to empty string
    assert.strictEqual(result[0][2], ''); // bentuk_pendidikan
    assert.strictEqual(result[0][3], ''); // status
    assert.strictEqual(result[0][4], ''); // alamat
    assert.strictEqual(result[0][7], 'DKI Jakarta');
  });

  it('returns url with leading slash', () => {
    const schools = [
      {
        npsn: '12345678',
        nama: 'Test',
        provinsi: 'Test',
        kab_kota: 'Test',
        kecamatan: 'Test',
      },
    ];
    const result = prepareSchoolDataForSearch(schools);
    assert.ok(result[0][8].startsWith('/'), 'URL should start with /');
  });

  it('F046: skips invalid school rows instead of aborting the whole build', () => {
    const schools = [
      {
        npsn: '12345678',
        nama: 'Valid School',
        provinsi: 'DKI Jakarta',
        kab_kota: 'Jakarta Pusat',
        kecamatan: 'Menteng',
      },
      { npsn: '99999' }, // missing required fields -> getSchoolRelativePath throws
      {
        npsn: '87654321',
        nama: 'Another Valid School',
        provinsi: 'Jawa Barat',
        kab_kota: 'Bandung',
        kecamatan: 'Coblong',
      },
    ];

    const result = prepareSchoolDataForSearch(schools);

    assert.strictEqual(result.length, 2, 'invalid row is skipped, valid rows kept');
    assert.strictEqual(result[0][0], '12345678');
    assert.strictEqual(result[1][0], '87654321');
  });

  it('output field order follows SEARCH_DATA_FIELDS (single source of truth)', () => {
    const { SEARCH_DATA_FIELDS } = require('./data-schema');
    const school = {
      npsn: '12345678',
      nama: 'SD Negeri 1 Jakarta',
      bentuk_pendidikan: 'SD',
      status: 'N',
      alamat: 'Jl. Sudirman No. 1',
      kecamatan: 'Menteng',
      kab_kota: 'Jakarta Pusat',
      provinsi: 'DKI Jakarta',
    };

    const result = prepareSchoolDataForSearch([school])[0];

    assert.strictEqual(result.length, SEARCH_DATA_FIELDS.length);
    SEARCH_DATA_FIELDS.forEach((field, index) => {
      if (field === 'url') {
        assert.ok(result[index].startsWith('/'), 'url field should be a relative path');
        assert.ok(result[index].includes(school.npsn));
      } else {
        assert.strictEqual(result[index], school[field], `position ${index} should hold ${field}`);
      }
    });
  });
});

describe('buildHomepageData', () => {
  const { buildHomepageData } = require('../src/services/PageBuilder');

  it('returns HTML string for valid schools array', () => {
    const schools = [
      {
        npsn: '12345',
        nama: 'SD Test',
        provinsi: 'DKI Jakarta',
        kab_kota: 'Jakarta Pusat',
        kecamatan: 'Menteng',
        bentuk_pendidikan: 'SD',
      },
    ];
    const result = buildHomepageData(schools);
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('<!DOCTYPE html>'));
    assert.ok(result.includes('Sekolah PSEO'));
    assert.ok(result.includes('schools.json'));
  });

  it('handles empty schools array', () => {
    const result = buildHomepageData([]);
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('<!DOCTYPE html>'));
  });

  it('throws IntegrationError for null input', () => {
    assert.throws(() => buildHomepageData(null), { name: 'IntegrationError' });
  });

  it('throws IntegrationError for string input', () => {
    assert.throws(() => buildHomepageData('invalid'), { name: 'IntegrationError' });
  });

  it('throws IntegrationError for object input', () => {
    assert.throws(() => buildHomepageData({}), { name: 'IntegrationError' });
  });

  it('includes search functionality in output', () => {
    const result = buildHomepageData([]);
    assert.ok(result.includes('search'));
    assert.ok(result.includes('provinsi'));
  });
});
