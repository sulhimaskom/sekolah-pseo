# Bug List

- [x] bug: `npm test` fails due to missing `pino` module.
- [x] bug: `scripts/config.test.js` fails because it expects `ROOT_DIR` to end with `sekolah-pseo`.
- [x] bug: `X-Frame-Options` and `Strict-Transport-Security` are set via `<meta>` tags in `src/presenters/templates/school-page.js`, which is invalid and causes console errors.
