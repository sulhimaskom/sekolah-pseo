# Security Engineer - Long-term Memory

> Last updated: 2026-02-27

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

- **Only runtime dependency**: pino for logging
- **Dev dependency**: ESLint for code linting
- **No external network calls** in the application code

#### 7. Git Security

- **.gitignore**: Properly configured to exclude .env files, node_modules, logs

#### 8. Security Researcher Coordination

- **Location**: `public/security.txt` (RFC 9116)
- Provides security contact information and scope
- Encourages responsible disclosure

#### 9. CI Security Checks

- **npm audit**: Runs on CI to detect known vulnerabilities

#### 10. Command Injection Protection

- **Location**: `scripts/fetch-data.js` - `validateRepoUrl()` function
- **Coverage**: All repository URLs passed to git commands are validated and sanitized
- **Validation**:
  - Only allows http and https protocols
  - Validates hostname is present
  - Reconstructs URL to remove any injected characters
  - Validates URL ends with .git for git repositories
HV|- **Exports**: `validateRepoUrl` function for testing
WR|
#### 11. CSV Formula Injection Protection

YB|- **Location**: `scripts/utils.js` - `escapeCsvField()` function
RT|- **Protection**: Prefixes dangerous characters (=, +, -, @, tab) with single quote
YX|- **Purpose**: Prevents spreadsheet applications from executing formulas from CSV data
BT|- **Coverage**: All CSV exports use this function

#### 12. Least-Privilege Workflow Permissions

VX|- **Location**: `.github/workflows/*.yml`
YX|- **Implementation**: Permissions reduced to minimum required for each workflow
BT|- **Changes**:
SP|  - Removed unnecessary `id-token: write` permissions
SQ|  - Removed unnecessary `actions: write` permissions
WS|  - Workflows only request what's needed (contents, issues, pull-requests)

#### 13. Self-Hosted Runner Security

YN|- **Location**: `orchestrator.yml`, `architect-agent.yml`
VK|- **Status**: Uses self-hosted runners for AI agent execution
KQ|- **Security Requirements**:
TM|  - Runner must be on isolated network segment
TB|  - Runner must have no persistent storage of secrets
XW|  - Runner credentials must rotate regularly
YJ|  - Runner should be ephemeral where possible
ZJ|- **Alternative**: Consider GitHub-hosted runners for production

#### 14. AI Agent Secret Handling

BQ|- **Design Decision**: Workflows pass secrets to AI agents via environment variables
VR|- **Rationale**: AI agents (OpenCode) require API keys to execute tasks
JM|- **Risk Mitigation**:
PQ|  - Secrets limited to specific workflow steps where needed
XZ|  - Runner isolation prevents secret exfiltration
RB|  - Regular secret rotation recommended
JB|- **Future**: Consider ephemeral credential pools for AI operations
WR|

### Code Patterns to Maintain

#### DO ✅

- Always use `escapeHtml()` for any user data in HTML templates
- Always use `safeReadFile`, `safeWriteFile`, etc. from `fs-safe.js`
- Always validate environment variable paths with `validatePath()`
- Always use `slugify()` for URL components
- Always validate and sanitize external URLs before using in shell commands

#### DON'T ❌

- Never use `eval()`, `new Function()`, or dynamic code execution
- Never concatenate user input directly into file paths without slugify/validatePath
- Never store secrets in the codebase

### Dependencies Audit

| Package | Version | Type    | Notes          |
| ------- | ------- | ------- | -------------- |
| eslint  | ^10.0.0 | dev     | Code linting   |
| pino    | ^10.3.1 | runtime | Logging        |
| globals | ^17.0.0 | dev     | ESLint globals |

XS|### Future Security Considerations
SS|
MZ|1. ~~**Security.txt**~~: Add `public/security.txt` for security researcher coordination ✅ (Done)
VK|2. ~~**npm audit**~~: Add to CI pipeline ✅ (Done)
SB|3. ~~**Modern Security Headers**~~: Add Permissions-Policy, COOP, CORP headers ✅ (Done)
XY|4. ~~**Command Injection Protection**~~: Add URL validation for git operations ✅ (Done)
KK|5. ~~**CSV Formula Injection**~~: Add formula injection protection to CSV exports ✅ (Done)
TH|6. ~~**Least-Privilege Permissions**~~: Reduce workflow permissions ✅ (Done)
YM|7. ~~**Self-Hosted Runner Security**~~: Document runner security requirements ✅ (Done)
JK|8. **Subresource Integrity**: Add SRI hashes if external resources are added

1. ~~**Security.txt**~~: Add `public/security.txt` for security researcher coordination ✅ (Done)
2. ~~**npm audit**~~: Add to CI pipeline ✅ (Done)
3. ~~**Modern Security Headers**~~: Add Permissions-Policy, COOP, CORP headers ✅ (Done)
4. ~~**Command Injection Protection**~~: Add URL validation for git operations ✅ (Done)
5. **Subresource Integrity**: Add SRI hashes if external resources are added

### Contact

For security issues, please contact the project maintainers through GitHub issues with "security" label.
