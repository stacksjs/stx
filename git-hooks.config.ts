// git-hooks.config.ts
import type { GitHooksConfig } from "bun-git-hooks";

const config: GitHooksConfig = {
  "pre-commit": {
    "staged-lint": {
      "*.{js,ts,tsx,stx}": "bun eslint --fix",
      "*.{ts,tsx,stx}": ["bun eslint --fix", "bun prettier --write"],
      "*.css": "bun stylelint --fix",
      "*.md": "bun prettier --write",
    },
  },
  "commit-msg": "bun node_modules/@stacksjs/gitlint/dist/bin/cli.js --edit $1",
  "post-commit": "bun run changelog:generate",
  "pre-push": "bun run build",
};

export default config;
