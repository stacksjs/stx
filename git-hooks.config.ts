// git-hooks.config.ts
import type { GitHooksConfig } from 'bun-git-hooks'

const config: GitHooksConfig = {
  'pre-commit': {
    'staged-lint': {
      '*.{js,ts,tsx,stx}': './node_modules/.bin/eslint --fix',
      '*.{ts,tsx,stx}': [
        './node_modules/.bin/eslint --fix',
        './node_modules/.bin/prettier --write',
      ],
      '*.css': './node_modules/.bin/stylelint --fix',
      '*.md': './node_modules/.bin/prettier --write',
    },
  },
  'commit-msg': 'bun node_modules/@stacksjs/gitlint/dist/bin/cli.js --edit $1',
  'post-commit': 'bun run changelog:generate',
  'pre-push': 'bun run build',
}

export default config
