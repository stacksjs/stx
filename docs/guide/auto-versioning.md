# Automatic Versioning with @stacksjs/bumpx and @stacksjs/logsmith

This project uses an automated versioning system that analyzes conventional commits to determine version bumps and automatically generates changelogs following semantic versioning principles.

## How It Works

The system combines two powerful tools:

- **[@stacksjs/bumpx](https://github.com/stacksjs/bumpx)** - For version bumping based on semantic versioning
- **[@stacksjs/logsmith](https://github.com/stacksjs/logsmith)** - For generating beautiful changelogs from conventional commits

## Conventional Commits Standard

Our auto-versioning follows the [conventional commits specification](https://gist.github.com/joshbuchea/6f47e86d2510bce28f8e7f42ae84c716) with the format:

```
<type>(<scope>): <subject>
```

### Commit Types and Semantic Versioning Impact

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature for the user | **MINOR** |
| `fix` | Bug fix for the user | **PATCH** |
| `docs` | Documentation changes | **PATCH** |
| `style` | Formatting, missing semi colons, etc | **PATCH** |
| `refactor` | Refactoring production code | **PATCH** |
| `test` | Adding missing tests, refactoring tests | **PATCH** |
| `chore` | Updating build tasks, package manager configs | **PATCH** |
| `perf` | Performance improvements | **PATCH** |

### Breaking Changes (MAJOR version bump)

Breaking changes can be indicated in two ways:

1. **Exclamation mark after type**: `feat!: remove deprecated API`
2. **Breaking change footer**: Include `BREAKING CHANGE:` in commit body

Examples:
```bash
feat!: remove support for Node.js 16
fix(api)!: change response format for /users endpoint
feat: add new authentication method

BREAKING CHANGE: The old authentication method is no longer supported
```

## Automatic Triggering

### Post-Commit Hook
When you commit to the `main` branch, a post-commit hook automatically:

1. **Analyzes** conventional commits since the last release
2. **Determines** the appropriate version bump type
3. **Validates** commit message formats
4. **Runs** `@stacksjs/bumpx` with the determined version
5. **Generates** changelog using `@stacksjs/logsmith`
6. **Commits** the updated changelog

### Example Output

```bash
🔍 Analyzing conventional commits for semantic versioning...
📋 Analyzing commits since last tag: v1.2.3
📊 Found 3 commits to analyze:
  ✅ feat(auth): add OAuth2 support
  ✅ fix(api): resolve user validation bug
  ⚠️  Non-conventional: update readme

⚠️  Warning: 1 non-conventional commits found.
   These commits will not influence semantic versioning.

🎯 Semantic Version Bump Decision: MINOR
📋 Reason:
New features detected:
  • feat(auth): add OAuth2 support

🚀 Running @stacksjs/bumpx minor...
📝 Generating changelog with @stacksjs/logsmith...
✅ Version bump and changelog update completed successfully!
💡 Run "git push --follow-tags" to push changes to remote
```

## Manual Release Commands

You can also trigger releases manually:

```bash
# Automatic version detection based on commits
bun run release:auto

# Specific version bumps
bun run release:patch    # 1.0.0 → 1.0.1
bun run release:minor    # 1.0.0 → 1.1.0
bun run release:major    # 1.0.0 → 2.0.0

# General release (same as release:auto)
bun run release
```

## Commit Message Examples

### ✅ Good Examples
```bash
feat: add user authentication
feat(api): implement rate limiting
fix: resolve memory leak in worker process
fix(database): handle connection timeouts
docs: update API documentation
chore: update dependencies
test: add unit tests for auth module
refactor(utils): simplify string parsing
perf(database): optimize query performance

# Breaking changes
feat!: remove deprecated v1 API
fix(auth)!: change token format

# With scope and breaking change
feat(core)!: redesign plugin architecture

BREAKING CHANGE: The plugin interface has changed completely
```

### ❌ Bad Examples
```bash
updated stuff
fixes
new feature
WIP
fix bug
```

## Git Hook Configuration

The system is configured via:

- **`git-hooks.config.ts`** - Git hooks configuration
- **`scripts/auto-version.ts`** - Main auto-versioning logic
- **`.git/hooks/post-commit`** - Git hook that triggers auto-versioning

## Features

### 🔍 **Smart Analysis**
- Parses conventional commit messages with regex
- Detects breaking changes via `!` or `BREAKING CHANGE:`
- Handles commit scopes properly
- Warns about non-conventional commits

### 📊 **Comprehensive Reporting**
- Shows all analyzed commits
- Explains version bump decisions
- Lists specific commits affecting the version
- Highlights non-conventional commits

### 🛡️ **Safety Features**
- Only runs on `main` branch
- Validates commit message formats
- Skips if no version bump is needed
- Provides clear error messages

### 🎯 **Semantic Versioning Compliance**
- **MAJOR**: Breaking changes (`feat!:`, `fix!:`, `BREAKING CHANGE:`)
- **MINOR**: New features (`feat:`)
- **PATCH**: Everything else (`fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`, `perf:`)

## Troubleshooting

### Non-Conventional Commits
If commits don't follow the conventional format, they'll be flagged but won't prevent version bumping:

```bash
⚠️  Warning: 2 non-conventional commits found.
   These commits will not influence semantic versioning.
```

### No Version Bump Needed
If no conventional commits are found, no version bump occurs:

```bash
📝 No conventional commits found. No version bump needed.
```

### Manual Override
To force a specific version bump regardless of commits:

```bash
bunx @stacksjs/bumpx major --commit --tag --no-push
bunx @stacksjs/logsmith --output CHANGELOG.md
```

## Best Practices

1. **Use conventional commits consistently**
2. **Include meaningful scopes** when relevant: `feat(auth):`, `fix(api):`
3. **Document breaking changes** clearly in commit body
4. **Keep commit messages descriptive** but concise
5. **Test locally** before pushing to main
6. **Review generated changelog** before publishing

This automated system ensures consistent versioning and high-quality changelogs while following semantic versioning principles! 