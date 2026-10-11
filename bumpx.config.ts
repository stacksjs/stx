import { defineConfig } from '@stacksjs/bumpx'

export default defineConfig({
  recursive: true,
  // The marketplace extension is released with STX but intentionally excluded
  // from Bun's workspaces because it has its own packaging dependencies.
  additionalFiles: ['packages/vscode/package.json'],
})
