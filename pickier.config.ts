import type { PickierConfig } from 'pickier'

const config: Partial<PickierConfig> = {
  ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/bin/**', '**/packages/collections/**', '**/packages/vscode/**', '**/packages/benchmarks/**', '**/.stx/**', '**/examples/**'],

  lint: {
    extensions: ['ts', 'js'],
    reporter: 'stylish',
    cache: false,
    maxWarnings: -1,
  },

  rules: {
    // Allow console in CLI tools and build scripts
    noConsole: 'off',
    noDebugger: 'warn',
  },

  pluginRules: {
    // Disable false positives on TypeScript function signatures
    'regexp/no-unused-capturing-group': 'off',

    // Allow top-level await (supported in Bun and modern Node.js ESM)
    'ts/no-top-level-await': 'off',

    // Disable style rules that trigger false positives in embedded JS/CSS template strings
    'style/brace-style': 'off',
    'style/max-statements-per-line': 'off',

    // Disable indent rule (false positives in template strings with formatted output)
    'indent': 'off',
    'style/indent': 'off',
    '@stylistic/indent': 'off',

    // Disable false positive regexp rules on mathematical expressions
    'regexp/no-super-linear-backtracking': 'off',

    // Disable quote warnings (false positives in regex patterns that need to match both quote types)
    'quotes': 'off',
    'style/quotes': 'off',
    '@stylistic/quotes': 'off',
  },
}

export default config
