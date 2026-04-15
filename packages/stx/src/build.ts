import type { ProductionBuildOptions, ProductionBuildResult } from './production-builder'
import type { SSGConfig, SSGResult } from './ssg'
import type { BuildMode } from './build-mode-detector'
import path from 'node:path'
import { loadStxConfig } from './config'

export interface UnifiedBuildOptions {
  /** Project root directory (default: process.cwd()) */
  root?: string
  /** Enable debug/verbose output */
  debug?: boolean
  /** SSG-specific overrides (used when mode is 'ssg') */
  ssg?: Partial<SSGConfig>
  /** SSR-specific overrides (used when mode is 'ssr') */
  ssr?: Partial<ProductionBuildOptions>
}

export interface UnifiedBuildResult {
  mode: BuildMode
  ssg?: SSGResult
  ssr?: ProductionBuildResult
  duration: number
}

/**
 * Unified build entry point for stx applications.
 *
 * Build mode is determined by the `ssr` field in `stx.config.ts`:
 *
 * - **`ssr: false`** (default) → SSG → `dist/` (flat HTML files for S3 + CloudFront).
 *   `<script server>` blocks are executed at build time and their output is
 *   baked into the static HTML. The server block is stripped from the output.
 *
 * - **`ssr: true`** → SSR → `.output/` (server bundle for EC2 behind CloudFront).
 *   `<script server>` blocks run per-request on the Bun server.
 *
 * `<script server>` works in both modes — the `ssr` flag controls *when* it
 * runs (build time vs request time), not whether it's allowed.
 */
export async function buildApp(options: UnifiedBuildOptions = {}): Promise<UnifiedBuildResult> {
  const startTime = performance.now()
  const root = options.root || process.cwd()

  // ── Step 1: Read build mode from config ───────────────────────────
  const config = await loadStxConfig()
  const mode: BuildMode = config.ssr ? 'ssr' : 'ssg'

  console.log(`[stx build] Mode: ${mode.toUpperCase()}${config.ssr ? ' (ssr: true in stx.config.ts)' : ' (default — ssr is false)'}`)

  // NOTE: Removed the "components must be server OR client" validator.
  // Mixed <script server> + <script client> is a legitimate pattern:
  // <script server> for defineProps/withDefaults (compile-time prop
  // extraction) and <script client> for runtime interactivity. Vue does
  // the same with <script setup> + <script>.

  // ── Step 2: Dispatch to the correct builder ───────────────────────
  let ssgResult: SSGResult | undefined
  let ssrResult: ProductionBuildResult | undefined

  if (mode === 'ssg') {
    const { generateStaticSite } = await import('./ssg')
    ssgResult = await generateStaticSite({
      // Pull directory mappings from stx.config.ts. The config loader
      // may set root (e.g., 'resources') and strip it from pagesDir
      // (e.g., 'resources/views' → 'views'). Rejoin so generateStaticSite
      // resolves the correct full path from CWD.
      pagesDir: path.join(config.root || '.', config.pagesDir || config.build?.pagesDir || 'pages'),
      publicDir: path.join(config.root || '.', config.publicDir || config.build?.publicDir || 'public'),
      outputDir: config.build?.outputDir || 'dist',
      generate404: config.build?.generate404 ?? true,
      minify: config.build?.minify ?? true,
      cleanOutput: config.build?.cleanOutput ?? true,
      ...options.ssg,
    })
  }
  else {
    const { buildForProduction } = await import('./production-builder')
    ssrResult = await buildForProduction({
      outputDir: '.output',
      debug: options.debug,
      ...options.ssr,
    })
  }

  const duration = Math.round(performance.now() - startTime)

  return {
    mode,
    ssg: ssgResult,
    ssr: ssrResult,
    duration,
  }
}
