/**
 * Crosswind config for the ImageOptim example.
 *
 * Content paths are resolved against this file's own directory rather than
 * `process.cwd()`. When you run `./stx examples/imageoptim` from the repo
 * root, the dev server loads this config but Crosswind's content scanner
 * resolves relative globs against the Bun process cwd — which is the repo
 * root, not the example dir — and would find zero `.stx` files. Anchoring
 * to `import.meta.dir` makes the config portable.
 */
import { resolve } from 'node:path'

export default {
  content: [
    resolve(import.meta.dir, 'pages/**/*.stx'),
    resolve(import.meta.dir, 'components/**/*.stx'),
  ],
}
