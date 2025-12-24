/**
 * Build script to bundle stores for browser use
 */
import { build } from 'bun'
import { writeFileSync, readFileSync } from 'fs'

const result = await build({
  entrypoints: ['./lib/stores/index.ts'],
  outdir: './public/js',
  target: 'browser',
  format: 'iife',
  naming: 'voide-stores.js',
  minify: false, // Keep readable for debugging
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})

if (!result.success) {
  console.error('Build failed:', result.logs)
  process.exit(1)
}

// Wrap in global export
const bundlePath = './public/js/voide-stores.js'
let bundle = readFileSync(bundlePath, 'utf-8')

// The build creates an IIFE like (() => { ... exports_stores ... })();
// We need to capture exports_stores and expose it globally
// Replace the outer IIFE wrapper to assign to window

// Find and replace the IIFE pattern
bundle = bundle.replace(
  /^\(\(\) => \{/,
  'window.VoideStores = (function() {'
)
bundle = bundle.replace(
  /\}\)\(\);?\s*$/,
  '  return exports_stores;\n})();'
)

const wrapped = `/**
 * Voide Stores - Browser Bundle
 * Auto-generated, do not edit
 */
${bundle}
`

writeFileSync(bundlePath, wrapped)
console.log('Stores built successfully to public/js/voide-stores.js')
