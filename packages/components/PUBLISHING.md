# Publishing Guide for @stacksjs/components

This guide covers how to publish the components package to npm and JSR.

## Pre-Publishing Checklist

- [x] All 23 components migrated and tested
- [x] Build succeeds without errors
- [x] All tests pass (78 tests)
- [x] Integration tests pass (25 tests)
- [x] TypeScript definitions generated
- [x] Documentation complete
- [x] Release notes created
- [x] Version number updated in package.json
- [x] CI/CD pipeline configured
- [x] JSR configuration added

## Publishing to npm

### 1. Ensure you're logged in to npm

```bash
npm whoami
# If not logged in:
npm login
```

### 2. Build the package

```bash
cd packages/components
bun run build
```

### 3. Test the package locally

```bash
# Link the package
bun link

# In another project
bun link @stacksjs/components

# Test imports work
```

### 4. Publish to npm

```bash
# Dry run first
npm publish --dry-run

# Publish for real
npm publish --access public
```

## Publishing to JSR (JavaScript Registry)

### 1. Install JSR CLI

```bash
bunx jsr
```

### 2. Login to JSR

```bash
bunx jsr login
```

### 3. Publish to JSR

```bash
cd packages/components
bunx jsr publish
```

## Automated Publishing (via GitHub Actions)

The package is configured for automated publishing via GitHub Actions.

### Trigger a Release

1. **Update version** in `packages/components/package.json`

2. **Commit and tag**:
   ```bash
   git add .
   git commit -m "chore(components): release v0.2.0"
   git tag v0.2.0
   git push origin main --tags
   ```

3. **GitHub Actions will automatically**:
   - Run tests
   - Build the package
   - Publish to npm (if `NPM_TOKEN` secret is set)
   - Create a GitHub release

### Required Secrets

Set these in your GitHub repository settings:

- `NPM_TOKEN` - npm authentication token
  - Get from: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
  - Required permissions: "Automation" or "Publish"

## Post-Publishing

### 1. Verify the package

```bash
# Check npm
npm view @stacksjs/components

# Check JSR
bunx jsr info @stacksjs/components

# Test installation
bunx create-vite test-app
cd test-app
bun add @stacksjs/components
```

### 2. Update documentation

- Update main README with new version
- Update CHANGELOG.md
- Announce on social media/Discord/etc.

### 3. Create GitHub Release

If not automated:
- Go to https://github.com/stacksjs/stx/releases/new
- Tag: `v0.2.0`
- Title: `@stacksjs/components v0.2.0`
- Description: Copy from RELEASE_NOTES.md

## Version Naming

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.2.0): New features, backwards compatible
- **PATCH** (0.2.1): Bug fixes

## Troubleshooting

### "Package already exists"

If the package name is taken:
- Update `name` in `package.json` to include scope: `@your-org/components`
- Update all imports in documentation

### "403 Forbidden"

- Check you're logged in: `npm whoami`
- Verify your npm token has publish permissions
- Check package.json `publishConfig`

### Build fails

```bash
# Clean and rebuild
rm -rf dist node_modules
bun install
bun run build
```

### Tests fail

```bash
# Run tests to see what's failing
bun test
bun test test/integration/
```

## Rollback a Release

If something goes wrong:

```bash
# Deprecate a version
npm deprecate @stacksjs/components@0.2.0 "Version deprecated due to [reason]"

# Or unpublish within 72 hours
npm unpublish @stacksjs/components@0.2.0
```

## Support

- GitHub Issues: https://github.com/stacksjs/stx/issues
- Discord: [Your Discord link]
- Email: chris@stacksjs.org
