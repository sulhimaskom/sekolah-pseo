# Bugs and Errors

## BugLover Findings

- [x] bug: `ROOT_DIR` test failure in `scripts/config.test.js`. The test checks if `ROOT_DIR` ends with 'sekolah-pseo', which fails in environments where the directory name is different (e.g., `/app`).
