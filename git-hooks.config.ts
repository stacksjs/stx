// git-hooks.config.ts
import type { GitHooksConfig } from 'bun-git-hooks'

const config: GitHooksConfig = {
  'pre-commit': {
    'staged-lint': {
      '*.{js,ts,tsx,stx}': 'bun eslint --fix',
      '*.css': ['bun stylelint --fix', 'bun eslint --fix'],
      '*.md': ['bun prettier --write', 'bun eslint --fix'],
    },
  },
  'commit-msg': 'bun node_modules/@stacksjs/gitlint/dist/bin/cli.js --edit $1',
  'pre-push': 'bun run build',
}

export default config
