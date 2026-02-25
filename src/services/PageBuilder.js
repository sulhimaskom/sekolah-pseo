const path = require('path');
const slugify = require('../../scripts/slugify');
const { generateSchoolPageHtml } = require('../presenters/templates/school-page');

function buildSchoolPageData(school) {
  if (!school || typeof school !== 'object') {
    throw new Error('Invalid school object provided');
  }

  const requiredFields = ['provinsi', 'kab_kota', 'kecamatan', 'npsn', 'nama'];
  const missingFields = requiredFields.filter(field => !school[field]);

  if (missingFields.length > 0) {
    throw new Error(`School object missing required fields: ${missingFields.join(', ')}`);
  }

  const provinsiSlug = slugify(school.provinsi);
  const kabKotaSlug = slugify(school.kab_kota);
  const kecamatanSlug = slugify(school.kecamatan);
  const namaSlug = slugify(school.nama);

  const relativePath = path.join(
    'provinsi',
    provinsiSlug,
    'kabupaten',
    kabKotaSlug,
    'kecamatan',
    kecamatanSlug,
    `${school.npsn}-${namaSlug}.html`
  );

  return {
    relativePath,
    content: generateSchoolPageHtml(school, relativePath),
  };
}

function getUniqueDirectories(schools) {
  if (!Array.isArray(schools)) {
    throw new Error('schools must be an array');
  }

  const uniqueDirs = new Set();

  for (const school of schools) {
    const provinsiSlug = slugify(school.provinsi);
    const kabKotaSlug = slugify(school.kab_kota);
    const kecamatanSlug = slugify(school.kecamatan);

    const dirPath = path.join(
      'provinsi',
      provinsiSlug,
      'kabupaten',
      kabKotaSlug,
      'kecamatan',
      kecamatanSlug
    );

    uniqueDirs.add(dirPath);
  }

  return Array.from(uniqueDirs);
}

module.exports = {
  buildSchoolPageData,
  getUniqueDirectories,
};
