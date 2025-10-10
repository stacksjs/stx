#!/usr/bin/env bun
/**
 * Post-processing script to fix ocean color values in generated CSS
 *
 * Headwind outputs custom colors as literal strings instead of hex values.
 * This script fixes ocean colors to their correct hex values.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const cssPath = resolve(import.meta.dir, '../examples/dist/styles.css')

const colorReplacements = [
  // Process longest strings first to avoid partial replacements
  { from: /background-color:ocean-blue-green/g, to: 'background-color:#084E77' },
  { from: /--tw-gradient-from:ocean-blue-green/g, to: '--tw-gradient-from:#084E77' },
  { from: /--tw-gradient-to:ocean-blue-green/g, to: '--tw-gradient-to:#084E77' },

  { from: /background-color:ocean-green/g, to: 'background-color:#2980B9' },
  { from: /--tw-gradient-from:ocean-green/g, to: '--tw-gradient-from:#2980B9' },
  { from: /--tw-gradient-to:ocean-green/g, to: '--tw-gradient-to:#2980B9' },

  { from: /background-color:ocean-blue/g, to: 'background-color:#182848' },
  { from: /--tw-gradient-from:ocean-blue/g, to: '--tw-gradient-from:#182848' },
  { from: /--tw-gradient-to:ocean-blue/g, to: '--tw-gradient-to:#182848' },
]

try {
  console.log('🎨 Fixing ocean colors in generated CSS...')

  let css = await readFile(cssPath, 'utf-8')

  for (const { from, to } of colorReplacements) {
    css = css.replace(from, to)
  }

  await writeFile(cssPath, css)

  console.log('✅ Ocean colors fixed successfully!')
}
catch (error) {
  console.error('❌ Failed to fix ocean colors:', error)
  process.exit(1)
}
