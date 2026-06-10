/**
 * Preload script for runtime .stx file support
 *
 * Registers the stx plugin with Bun's runtime so .stx files can be
 * imported directly. This makes `import page from './index.stx'` work.
 *
 * Usage:
 *   bun --preload bun-plugin-stx/preload your-server.ts
 *
 * Or in bunfig.toml:
 *   preload = ["bun-plugin-stx/preload"]
 */
import { plugin } from 'bun'
import stxPlugin from './index'

plugin(stxPlugin())
