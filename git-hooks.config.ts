// git-hooks.config.ts
import type { GitHooksConfig } from 'bun-git-hooks'

const config: GitHooksConfig = {
  'pre-commit': {
    stagedLint: {
      '*.js': 'eslint --fix',
      '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
      '*.css': 'stylelint --fix',
      '*.md': 'prettier --write'
    }
  },
  'commit-msg': 'bun commitlint --edit $1',
  'pre-push': 'bun run build',
  'verbose': true,
}

export default config