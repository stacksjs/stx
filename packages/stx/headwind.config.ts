import type { HeadwindConfig } from '@stacksjs/headwind'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const config: Partial<HeadwindConfig> = {
  content: [
    path.resolve(__dirname, '../../examples/**/*.stx'),
    path.resolve(__dirname, '../../examples/**/*.{html,js,ts,jsx,tsx}'),
  ],
  output: path.resolve(__dirname, './examples/dist/styles.css'),
  minify: false,
  watch: false,
  safelist: [],
  blocklist: [],
}

export default config
