import type { BuddyBotConfig } from 'buddy-bot'

const config: BuddyBotConfig = {
  repository: {
    owner: 'stacksjs',
    name: 'stx',
    provider: 'github',
    // Uses GITHUB_TOKEN by default
  },
  dashboard: {
    enabled: true,
    title: 'Dependency Dashboard',
    // issueNumber: undefined, // Auto-generated
  },
  workflows: {
    enabled: true,
    outputDir: '.github/workflows',
    templates: {
      daily: true,
      weekly: true,
      monthly: true,
    },
    custom: [],
  },
  packages: {
    strategy: 'all',
    ignore: [
      // The VS Code extension compiles against the API of the oldest editor
      // it supports, so @types/vscode moves with `engines.vscode` in
      // packages/vscode/package.json, by hand. Raising it alone makes
      // `vsce publish` refuse the extension, and an earlier bump also rewrote
      // `engines.vscode` to ^1.999.0, which no editor can install.
      '@types/vscode',
    ],
    ignorePaths: [
      // Add file/directory paths to ignore using glob patterns
      // Example: 'packages/test-*/**', '**/*test-envs/**', 'apps/legacy/**'
    ],
  },
  verbose: false,
}

export default config
