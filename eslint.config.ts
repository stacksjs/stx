import type { ESLintConfig } from '@stacksjs/eslint-config'
import stacks from '@stacksjs/eslint-config'

const config: ESLintConfig = stacks({
  stylistic: {
    indent: 2,
    quotes: 'single',
  },

  typescript: true,
  jsonc: true,
  yaml: true,

  rules: {
    'no-console': 'off',
  },

  ignores: [
    'docs/**',
    'fixtures/**',
    '**/*.md',
    'packages/benchmarks/**',
    'packages/collections/**',
  ],
})

export default config
