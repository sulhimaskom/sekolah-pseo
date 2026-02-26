# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Email the maintainer directly at: [to be added by maintainer]
3. Include the following in your report:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact of the vulnerability
   - Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: You will receive an acknowledgment within 48 hours
- **Timeline**: We aim to provide a timeline for fixes within 7 days
- **Disclosure**: We request that you give us reasonable time to address the issue before public disclosure
- **Credit**: We will acknowledge your contribution in the security advisory (if desired)

## Security Best Practices

This project follows these security practices:

### Data Handling

- Input validation on all user-supplied data
- HTML escaping to prevent XSS attacks
- Path validation to prevent directory traversal
- No sensitive data is stored or processed

### Dependencies

- Regular dependency updates
- npm audit integration in CI pipeline
- Minimal external dependencies

### Build Process

- Static site generation (no server-side code execution)
- Content Security Policy (CSP) headers
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy

## Supported Security Features

### Input Validation

- CSV data validation with strict schema enforcement
- Coordinate bounds checking (Indonesia geographic bounds)
- NPSN numeric validation

### Path Security

- Path traversal prevention via `validatePath()` in `config.js`
- All file operations use safe wrappers with timeout protection

### Error Handling

- Standardized error format to prevent information leakage
- No stack traces exposed in production output

## CI/CD Secrets

This project is a static site generator that does **not require any external API secrets**.

### GitHub Actions

The following secrets are used by CI workflows:

| Secret         | Purpose                                                            | Required        |
| -------------- | ------------------------------------------------------------------ | --------------- |
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions for repository operations | Yes (automatic) |

### No External Secrets Required

This project does NOT require:

- Supabase credentials
- Cloudflare credentials
- Gemini/AI API keys
- IFlow API keys
- Any other external service credentials

The static site generation process reads from local data files (`data/schools.csv`) and generates HTML output. No external APIs are called during build or deployment.
