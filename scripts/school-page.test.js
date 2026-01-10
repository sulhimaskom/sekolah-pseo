const { describe, it } = require('node:test');
const assert = require('node:assert');
const { generateSchoolPageHtml } = require('../src/presenters/templates/school-page');

describe('generateSchoolPageHtml', () => {
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

  it('generates complete HTML for valid school object', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('<html lang="id">'));
    assert.ok(html.includes('</html>'));
  });

  it('includes all required school data in HTML', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('SD Negeri 1 Jakarta'));
    assert.ok(html.includes('12345678'));
    assert.ok(html.includes('DKI Jakarta'));
    assert.ok(html.includes('Jakarta Pusat'));
    assert.ok(html.includes('Menteng'));
    assert.ok(html.includes('Jl. Sudirman No. 1'));
    assert.ok(html.includes('SD'));
    assert.ok(html.includes('Negeri'));
  });

  it('throws error for null school object', () => {
    assert.throws(
      () => generateSchoolPageHtml(null),
      { message: 'Invalid school object provided' }
    );
  });

  it('throws error for undefined school object', () => {
    assert.throws(
      () => generateSchoolPageHtml(undefined),
      { message: 'Invalid school object provided' }
    );
  });

  it('throws error for non-object school input', () => {
    assert.throws(
      () => generateSchoolPageHtml('string'),
      { message: 'Invalid school object provided' }
    );

    assert.throws(
      () => generateSchoolPageHtml(123),
      { message: 'Invalid school object provided' }
    );
  });

  it('throws error for array input', () => {
    assert.throws(
      () => generateSchoolPageHtml([]),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for school object missing nama field', () => {
    const schoolWithoutNama = { ...validSchool, nama: undefined };

    assert.throws(
      () => generateSchoolPageHtml(schoolWithoutNama),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for school object missing npsn field', () => {
    const schoolWithoutNpsn = { ...validSchool, npsn: undefined };

    assert.throws(
      () => generateSchoolPageHtml(schoolWithoutNpsn),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for school object missing provinsi field', () => {
    const schoolWithoutProvinsi = { ...validSchool, provinsi: undefined };

    assert.throws(
      () => generateSchoolPageHtml(schoolWithoutProvinsi),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for school object missing kab_kota field', () => {
    const schoolWithoutKabKota = { ...validSchool, kab_kota: undefined };

    assert.throws(
      () => generateSchoolPageHtml(schoolWithoutKabKota),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for school object missing kecamatan field', () => {
    const schoolWithoutKecamatan = { ...validSchool, kecamatan: undefined };

    assert.throws(
      () => generateSchoolPageHtml(schoolWithoutKecamatan),
      { message: /School object missing required fields/ }
    );
  });

  it('throws error for school object with empty string required field', () => {
    const schoolWithEmptyNama = { ...validSchool, nama: '' };

    assert.throws(
      () => generateSchoolPageHtml(schoolWithEmptyNama),
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
      () => generateSchoolPageHtml(schoolWithMultipleMissing),
      { message: /School object missing required fields: (nama|npsn|provinsi)(, (nama|npsn|provinsi)){2}/ }
    );
  });

  it('includes security meta tags', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('Content-Security-Policy'));
    assert.ok(html.includes('X-Content-Type-Options'));
    assert.ok(html.includes('X-Frame-Options'));
    assert.ok(html.includes('Referrer-Policy'));
    assert.ok(html.includes('X-XSS-Protection'));
  });

  it('includes viewport meta tag for mobile responsiveness', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('<meta name="viewport"'));
    assert.ok(html.includes('width=device-width'));
    assert.ok(html.includes('initial-scale=1.0'));
  });

  it('includes skip link for keyboard navigation', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('<a href="#main-content" class="skip-link">'));
    assert.ok(html.includes('Langsung ke konten utama'));
  });

  it('includes skip link focus styles', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('class="skip-link"'));
    assert.ok(html.includes('href="/styles.css"'));
  });

  it('includes semantic HTML structure', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('<header'));
    assert.ok(html.includes('<main'));
    assert.ok(html.includes('<footer'));
    assert.ok(html.includes('<article'));
    assert.ok(html.includes('<section'));
    assert.ok(html.includes('<nav'));
  });

  it('includes ARIA landmarks', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('role="banner"'));
    assert.ok(html.includes('role="main"'));
    assert.ok(html.includes('role="contentinfo"'));
  });

  it('includes ARIA labels for navigation', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('aria-label="Navigasi utama"'));
  });

  it('includes aria-current for current page indicator', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('aria-current="page"'));
  });

  it('includes aria-labelledby for sections', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('aria-labelledby="school-name"'));
    assert.ok(html.includes('aria-labelledby="school-details"'));
  });

  it('includes aria-hidden for decorative elements', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('aria-hidden="true"'));
  });

  it('includes Schema.org structured data', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('application/ld+json'));
    assert.ok(html.includes('"@context": "https://schema.org"'));
    assert.ok(html.includes('"@type": "School"'));
  });

  it('includes school data in Schema.org structured data', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('"name": "SD Negeri 1 Jakarta"'));
    assert.ok(html.includes('"identifier": "12345678"'));
    assert.ok(html.includes('"educationalLevel": "SD"'));
  });

  it('includes address in Schema.org structured data', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('"@type": "PostalAddress"'));
    assert.ok(html.includes('"streetAddress": "Jl. Sudirman No. 1"'));
    assert.ok(html.includes('"addressLocality": "Menteng"'));
    assert.ok(html.includes('"addressRegion": "Jakarta Pusat"'));
    assert.ok(html.includes('"addressCountry": "ID"'));
  });

  it('escapes HTML in school name to prevent XSS', () => {
    const maliciousSchool = {
      ...validSchool,
      nama: '<script>alert("XSS")</script> Test School'
    };

    const html = generateSchoolPageHtml(maliciousSchool);

    assert.ok(!html.includes('<script>alert("XSS")</script>'));
    assert.ok(html.includes('&lt;script&gt;'));
    assert.ok(html.includes('&lt;/script&gt;'));
  });

  it('escapes HTML in alamat to prevent XSS', () => {
    const maliciousSchool = {
      ...validSchool,
      alamat: '<img src=x onerror=alert(1)> Street'
    };

    const html = generateSchoolPageHtml(maliciousSchool);

    assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
    assert.ok(html.includes('&lt;img'));
  });

  it('escapes HTML in provinsi to prevent XSS', () => {
    const maliciousSchool = {
      ...validSchool,
      provinsi: '<div>Malicious</div> Province'
    };

    const html = generateSchoolPageHtml(maliciousSchool);

    assert.ok(!html.includes('<div>Malicious</div>'));
    assert.ok(html.includes('&lt;div&gt;'));
  });

  it('escapes HTML in kab_kota to prevent XSS', () => {
    const maliciousSchool = {
      ...validSchool,
      kab_kota: '<span>XSS</span> City'
    };

    const html = generateSchoolPageHtml(maliciousSchool);

    assert.ok(!html.includes('<span>XSS</span>'));
  });

  it('escapes HTML in kecamatan to prevent XSS', () => {
    const maliciousSchool = {
      ...validSchool,
      kecamatan: '<a href="evil.com">Link</a> District'
    };

    const html = generateSchoolPageHtml(maliciousSchool);

    assert.ok(!html.includes('<a href="evil.com">Link</a>'));
  });

  it('escapes HTML in bentuk_pendidikan to prevent XSS', () => {
    const maliciousSchool = {
      ...validSchool,
      bentuk_pendidikan: '<script>evil</script> SD'
    };

    const html = generateSchoolPageHtml(maliciousSchool);

    assert.ok(!html.includes('<script>evil</script>'));
  });

  it('escapes HTML in status to prevent XSS', () => {
    const maliciousSchool = {
      ...validSchool,
      status: '<img src=x onerror=alert(1)> Negeri'
    };

    const html = generateSchoolPageHtml(maliciousSchool);

    assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
  });

  it('escapes HTML in NPSN to prevent XSS', () => {
    const maliciousSchool = {
      ...validSchool,
      npsn: '<script>alert(1)</script>12345678'
    };

    const html = generateSchoolPageHtml(maliciousSchool);

    assert.ok(!html.includes('<script>alert(1)</script>'));
  });

  it('handles special characters in school data', () => {
    const schoolWithSpecialChars = {
      ...validSchool,
      nama: 'SMA N 1 & "Test" School',
      alamat: 'Jl. Merdeka No. 1, Apt. 2B'
    };

    const html = generateSchoolPageHtml(schoolWithSpecialChars);

    assert.ok(html.includes('SMA N 1 &amp; &quot;Test&quot; School'));
    assert.ok(html.includes('Jl. Merdeka No. 1, Apt. 2B'));
  });

  it('uses definition list (dl/dt/dd) for school details', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('<dl class="school-details-list">'));
    assert.ok(html.includes('<dt>NPSN</dt>'));
    assert.ok(html.includes('<dd>'));
    assert.ok(html.includes('</dl>'));
  });

  it('includes external CSS link', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('<link rel="stylesheet" href="/styles.css">'));
    assert.ok(html.includes('class="skip-link"'));
    assert.ok(html.includes('class="sr-only"'));
    assert.ok(html.includes('class="school-details-list"'));
  });

  it('includes screen reader only class styles', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('class="sr-only"'));
  });

  it('includes school details list grid styles', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('class="school-details-list"'));
    assert.ok(html.includes('<dt>'));
    assert.ok(html.includes('<dd>'));
  });

  it('includes sr-only heading for screen readers', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('class="sr-only">Detail Sekolah</h2>'));
  });

  it('generates unique id attributes for accessibility', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('id="main-content"'));
    assert.ok(html.includes('id="school-name"'));
    assert.ok(html.includes('id="school-details"'));
  });

  it('includes footer with copyright information', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('&copy; 2026 Sekolah PSEO'));
    assert.ok(html.includes('Data sekolah berasal dari Dapodik'));
  });

  it('handles empty optional fields gracefully', () => {
    const schoolWithEmptyOptional = {
      ...validSchool,
      alamat: '',
      status: ''
    };

    const html = generateSchoolPageHtml(schoolWithEmptyOptional);

    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('</html>'));
  });

  it('generates consistent output for same input', () => {
    const html1 = generateSchoolPageHtml(validSchool);
    const html2 = generateSchoolPageHtml(validSchool);

    assert.strictEqual(html1, html2);
  });

  it('includes UTF-8 charset meta tag', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('<meta charset="utf-8"'));
  });

  it('includes page title with school name', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('<title>SD Negeri 1 Jakarta</title>'));
  });

  it('escapes HTML in page title', () => {
    const maliciousSchool = {
      ...validSchool,
      nama: '</title><script>alert(1)</script>'
    };

    const html = generateSchoolPageHtml(maliciousSchool);

    assert.ok(!html.includes('</title><script>alert(1)</script>'));
    assert.ok(html.includes('&lt;/title&gt;&lt;script&gt;'));
  });

  it('includes main content id for skip link target', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('<main id="main-content"'));
  });

  it('generates complete HTML structure', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.match(html, /^<!DOCTYPE html>/);
    assert.ok(html.endsWith('</html>'));
    assert.ok(html.includes('<html lang="id">'));
    assert.ok(html.includes('<head>'));
    assert.ok(html.includes('</head>'));
    assert.ok(html.includes('<body>'));
    assert.ok(html.includes('</body>'));
  });

  it('includes navigation with home link', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('<a href="/">Beranda</a>'));
  });

  it('includes separator in navigation', () => {
    const html = generateSchoolPageHtml(validSchool);

    assert.ok(html.includes('<span aria-hidden="true"> / </span>'));
  });
});
