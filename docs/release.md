# Release Management

This document describes the release process for the Sekolah PSEO project.

## Versioning

This project follows **Semantic Versioning** (SemVer): `MAJOR.MINOR.PATCH`

| Component | When to Bump | Example |
|-----------|-------------|---------|
| **MAJOR** | Breaking changes (output format, API contract, required fields removed) | `1.0.0` → `2.0.0` |
| **MINOR** | New backward-compatible functionality | `1.0.0` → `1.1.0` |
| **PATCH** | Bug fixes, performance improvements, dependency updates | `1.0.0` → `1.0.1` |

The current version is tracked in `package.json` (`"version": "1.0.0"`).

## Release Process

### 1. Prepare the Release

Ensure `main` branch is in a releasable state:

```bash
# Switch to main and pull latest
git checkout main
git pull origin main

# Verify everything passes
npm ci
npm run lint
npm test
npm run build
npm run sitemap
npm run validate-links
```

### 2. Update Version

Update the version in `package.json`:

```bash
# For a patch release (bug fixes)
npm version patch

# For a minor release (new features)
npm version minor

# For a major release (breaking changes)
npm version major
```

This will:
- Update `package.json` with the new version
- Create a git commit with the version change
- Create a git tag (e.g., `v1.0.1`)

### 3. Push the Tag

```bash
# Push the commit and tag
git push origin main --follow-tags
```

### 4. Automated Release

Pushing a tag matching `v*` triggers the **release workflow** (`.github/workflows/release.yml`), which:

1. Checks out the code
2. Installs dependencies
3. Runs linting
4. Runs the full test suite
5. Builds the site
6. Creates a **GitHub Release** with auto-generated release notes

The release will appear at:
`https://github.com/sulhimaskom/sekolah-pseo/releases`

### 5. Verify

1. Check the [Releases page](https://github.com/sulhimaskom/sekolah-pseo/releases) for the new release
2. Verify the release notes are accurate
3. If deploying, refer to [deployment.md](deployment.md) for platform-specific steps

## Rollback Strategy

### If a release introduces issues:

1. **Identify the last known-good version tag** from the [Releases page](https://github.com/sulhimaskom/sekolah-pseo/releases)

2. **Revert the code**:
   ```bash
   # Create a fix branch from the broken release
   git checkout -b fix/rollback-v1.0.1

   # Revert the problematic commits
   git revert <commit-hash>  # Revert specific commits
   # OR: revert to a previous tag
   git revert HEAD~1..HEAD   # Revert last N commits

   # Test the fix
   npm ci && npm run lint && npm test && npm run build

   # Push and create a PR
   git push origin fix/rollback-v1.0.1
   ```

3. **Create a patch release** after merging the revert:
   ```bash
   git checkout main
   git pull origin main
   npm version patch
   git push origin main --follow-tags
   ```

4. **For deployment rollback** (static site):
   - **GitHub Pages**: Revert the `gh-pages` branch to the previous build
   - **Netlify**: Use Netlify's instant rollback feature in the Deploys panel
   - **Vercel**: Use Vercel's Instant Rollback feature in the Dashboard

### Emergency Rollback (no code change needed):

For static hosting platforms, you can often revert the deployment without reverting code:

| Platform    | Rollback Method |
|-------------|----------------|
| GitHub Pages | Push previous dist/ to gh-pages branch |
| Netlify     | Deploys → select previous deploy → "Publish deploy" |
| Vercel      | Deployments → select previous deployment → "Promote to Production" |
| Traditional | Restore from backup or redeploy previous dist/ |

## Release Checklist

Before cutting a release, verify:

- [ ] `npm run lint` passes with no errors or warnings
- [ ] `npm test` passes (all JS and Python tests)
- [ ] `npm run build` completes successfully
- [ ] `npm run sitemap` generates valid sitemap
- [ ] `npm run validate-links` reports no broken links
- [ ] `package.json` version is updated
- [ ] `CHANGELOG.md` is updated (if maintained)
- [ ] Git tag is pushed
- [ ] GitHub Release is created
- [ ] Deployment is verified on target platform

## Related

- [Deployment Guide](deployment.md) — Platform-specific deployment instructions
- [CI/CD Workflows](../.github/workflows/) — Automation details
- [Contributing Guide](../CONTRIBUTING.md) — Development workflow
