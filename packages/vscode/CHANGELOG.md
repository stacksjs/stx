# Change Log

All notable changes to the stx VSCode extension will be documented in this file.

## [Unreleased]

### Added

- Initial release of stx language support
- Syntax highlighting for stx files
- Snippets for common stx patterns
- Component and directive autocompletion
- Hover documentation for stx syntax
- Go to definition support
- Document link provider
- UnoCSS integration

### Changed

- Published under its own marketplace ID, `Stacks.vscode-stx`. It used to declare `Stacks.vscode-stacks`, the ID of the Stacks framework extension ([#2020](https://github.com/stacksjs/stx/issues/2020))
- The language support is also published as a library, `@stacksjs/stx-vscode`, which the Stacks extension embeds. When the Stacks extension is installed and serving stx, this extension stands down instead of registering everything a second time
- Removed the `Stacks.*` settings, which nothing read, and the `stx.setLanguageMode` command, which nothing registered
- Bundled the utility-class engine and Prettier into the extension, so the installed extension no longer depends on a `node_modules` it does not ship with
- Improved TypeScript integration
- Enhanced snippet suggestions
- Better error handling

### Fixed

- Various syntax highlighting issues
- Snippet formatting inconsistencies
- Path resolution in imports
