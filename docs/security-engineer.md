# Security Engineer - Long-term Memory

> Last updated: 2026-02-25

## Project Security Posture

This document serves as the security reference for the Sekolah PSEO project.

### Project Type
- **Static Site Generator** for Indonesian school data
- **Build-time tool** - No runtime server, no external network calls
- **Node.js/CommonJS** with minimal dependencies

### Security Measures Implemented

#### 1. XSS Protection
- **Location**: `scripts/utils.js` - `escapeHtml()` function
- **Coverage**: All user inputs in HTML templates are escaped
- **Template**: `src/presenters/templates/school-page.js` - uses `escapeHtml()` on all school data fields

#### 2. Security Headers
- **Location**: `src/presenters/templates/school-page.js`, `homepage.js`, `province-page.js`
- **Headers Applied**:
  - Content-Security-Policy (CSP)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: SAMEORIGIN
  - Referrer-Policy: strict-origin-when-cross-origin
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security (HSTS): max-age=31536000; includeSubDomains
  - Permissions-Policy: Disables accelerometer, camera, geolocation, gyroscope, magnetometer, microphone, payment, usb
  - Cross-Origin-Opener-Policy (COOP): same-origin
  - Cross-Origin-Resource-Policy (CORP): same-origin
- **Location**: `src/presenters/templates/school-page.js`
- **Headers Applied**:
  - Content-Security-Policy (CSP)
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: SAMEORIGIN
  - Referrer-Policy: strict-origin-when-cross-origin
  - X-XSS-Protection: 1; mode=block

#### 3. Path Traversal Protection
- **Location**: `scripts/config.js` - `validatePath()` function
- **Slug sanitization**: `scripts/slugify.js` - ensures slugs only contain [a-z0-9-]
- **Validation**: RAW_DATA_PATH environment variable is validated against ROOT_DIR

#### 4. Rate Limiting & Circuit Breakers
- **Rate Limiter**: `scripts/rate-limiter.js` - prevents DoS on file system
- **Circuit Breakers**: `scripts/fs-safe.js` - prevents cascading failures
- **Timeouts**: All file operations have configurable timeouts

#### 5. Input Validation
- **Required fields**: `src/presenters/templates/school-page.js` - validates presence of required fields
- **CSV parsing**: `scripts/utils.js` - robust CSV parser with quote handling

#### 6. Safe Dependencies
- **Only runtime dependency**: Node.js built-in modules (fs, path)
- **Dev dependency**: ESLint 9.39.2
- **No external network calls** in the application code

#### 7. Git Security
- **.gitignore**: Properly configured to exclude .env files, node_modules, logs

#### 8. Security Researcher Coordination
- **Location**: `public/security.txt` (RFC 9116)
- Provides security contact information and scope
- Encourages responsible disclosure

#### 9. CI Security Checks
- **npm audit**: `.github/workflows/security-audit.yml` - Runs weekly and on PR/push to detect known vulnerabilities

### Code Patterns to Maintain
- **.gitignore**: Properly configured to exclude .env files, node_modules, logs

### Code Patterns to Maintain

#### DO ✅
- Always use `escapeHtml()` for any user data in HTML templates
- Always use `safeReadFile`, `safeWriteFile`, etc. from `fs-safe.js`
- Always validate environment variable paths with `validatePath()`
- Always use `slugify()` for URL components

#### DON'T ❌
- Never use `eval()`, `new Function()`, or dynamic code execution
- Never make external network calls (fetch, http, https)
- Never concatenate user input directly into file paths without slugify/validatePath
- Never store secrets in the codebase

### Dependencies Audit

| Package | Version | Type | Notes |
|---------|---------|------|-------|
| eslint | 9.39.2 | dev | Code linting |
| globals | ^17.0.0 | dev | ESLint globals |

### Future Security Considerations

1. ~~**Security.txt**~~: Add `public/security.txt` for security researcher coordination ✅ (Done)
2. ~~**npm audit**~~: Add to CI pipeline ✅ (Done)
3. ~~**Modern Security Headers**~~: Add Permissions-Policy, COOP, CORP headers ✅ (Done)
4. **Subresource Integrity**: Add SRI hashes if external resources are added

### Contact

For security issues, please contact the project maintainers through GitHub issues with "security" label.

1. ~~**Security.txt**~~: Add `public/security.txt` for security researcher coordination ✅ (Done)
2. ~~**npm audit**~~: Add to CI pipeline ✅ (Done)
3. **Subresource Integrity**: Add SRI hashes if external resources are added

### Contact

1. **Security.txt**: Add `public/security.txt` for security researcher coordination
2. **Subresource Integrity**: Add SRI hashes if external resources are added
3. **npm audit**: Consider adding to CI pipeline

### Contact

For security issues, please contact the project maintainers through GitHub issues with "security" label.
