/**
 * Shared HTML document head prefix module.
 *
 * Contains the boilerplate HTML head tags that are identical across all page types
 * (school pages, province pages, homepage). Extracting these to a single constant
 * eliminates ~1.2KB of duplication per page — saving ~4MB of total output across
 * all 3474+ generated pages, and keeping the security configuration in one place.
 *
 * Each template appends its own description, title, canonical URL, OG tags,
 * and stylesheet link after this prefix.
 */

'use strict';

const HTML_HEAD_PREFIX = `\
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
  <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
  <meta http-equiv="Permissions-Policy" content="accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()">
  <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin">
  <meta http-equiv="Cross-Origin-Resource-Policy" content="same-origin">
  <meta name="theme-color" content="#2563eb" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#111827" media="(prefers-color-scheme: dark)">
  <meta http-equiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
`;

module.exports = { HTML_HEAD_PREFIX };
