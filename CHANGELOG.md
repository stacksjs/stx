# Changelog

[Compare changes](https://github.com/stacksjs/stx/compare/v0.3.0...HEAD)

### Contributors

- Adelino Ngomacha <Adelinob335@gmail.com>

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2024-12-17

### 🚀 Features

- **auto-version**: Enable automatic versioning with bumpx integration
- **auto-version**: Rewrite auto-version to create single commit for all changes
- **build**: Enhanced release process with proper semantic versioning

### 🐛 Bug Fixes

- **auto-version**: Prevent infinite loop in auto-version system
- **auto-version**: Improve auto-version script with proper changelog generation
- **auto-version**: Bulletproof loop prevention with multiple safety layers
- **build**: Use local node_modules and fix post-commit hook
- **build**: Fix changelog script to use logsmith instead of changelogen
- **build**: Remove broken tag-name template from bumpx

### 🧪 Tests

- Fix auto-version tests to expect v0.3.0 and prevent loops
- Add comprehensive loop prevention testing
- Add real commit scenario testing

### 🏗️ Build System

- Configure git hooks for automatic versioning
- Set up bumpx and logsmith integration
- Implement semantic versioning workflow
- Enhanced post-commit hook with 9 safety layers
- Improved release scripts (release:major, release:minor, release:patch)

### 📝 Documentation

- Add comprehensive auto-versioning documentation
- Update testing documentation

### ❤️ Contributors

- Adelino Ngomacha <Adelinob335@gmail.com>

## [0.1.0] - 2024-12-17

Initial release with basic STX functionality.

### ✨ Features

- Core STX templating engine
- Laravel Blade-inspired syntax
- Bun plugin integration
- Component system
- Directive support
- TypeScript integration

### 🏗️ Build System

- Configure git hooks for automatic versioning
- Set up bumpx and logsmith integration
- Implement semantic versioning workflow

### Contributors

- Adelino Ngomacha <Adelinob335@gmail.com>

[Unreleased]: https://github.com/stacksjs/stx/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/stacksjs/stx/compare/v0.1.0...v0.3.0
[0.1.0]: https://github.com/stacksjs/stx/releases/tag/v0.1.0
