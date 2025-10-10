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
  theme: {
    extend: {
      colors: {
        'ocean-blue': '#182848',
        'ocean-green': '#2980B9',
        'ocean-blue-green': '#084E77',
        'blue-gray': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
    },
  },
}

export default config
