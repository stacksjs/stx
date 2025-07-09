// git-hooks.config.ts
import type { GitHooksConfig } from "bun-git-hooks";

const config: GitHooksConfig = {
  "pre-commit": {
    "staged-lint": {
      "*.{js,ts,tsx,stx}": "bunx eslint --fix",
      "*.{ts,tsx,stx}": ["bunx eslint --fix", "bunx prettier --write"],
      "*.css": "bunx stylelint --fix",
      "*.md": "bunx prettier --write",
    },
  },
  "commit-msg": "bunx @stacksjs/gitlint --edit $1",
  "post-commit": "bun run changelog:generate",
  "pre-push": "bun run build",
};

export default config;
