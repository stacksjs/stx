/**
 * Preload script for runtime .stx file support
 * This allows Bun to import .stx files directly at runtime
 *
 * Usage:
 *   bun --preload bun-plugin-stx/preload your-file.ts
 *
 * Or in bunfig.toml:
 *   preload = ["bun-plugin-stx/preload"]
 */

import { plugin } from 'bun'
import stxPlugin from './index'

// Register the plugin globally for runtime imports
plugin(stxPlugin())

console.log('✅ stx plugin loaded - .stx files can now be imported')
