/**
 * Client Script Bundler
 *
 * Uses Bun.build to resolve and bundle imports in `<script client>` blocks.
 * Only activates when real user imports are detected (local files, npm packages).
 * stx runtime, @stores, and @composables are marked as external — handled
 * by existing auto-import and store-import transforms.
 *
 * @module client-script-bundler
 */

import path from 'node:path'
import fs from 'node:fs' // kept for mkdir/rmSync (no Bun equivalent for dir ops)
import type { BunPlugin } from 'bun'
import { getPublicEnvDefine } from './public-env'

// Known imports that are NOT user imports — handled by other transforms
const EXTERNAL_PATTERNS = [
  /^stx$/,
  /^@stacksjs\/stx$/,
  /^@stacksjs\/browser$/,
  /^@stores$/,
  /^stx\/stores$/,
  /^@composables$/,
]

/**
 * Check if a script has user imports that need Bun.build bundling.
 *
 * Returns false for:
 * - `import type { ... }` (type-only — stripped by TS transpiler)
 * - `import { ... } from 'stx'` (auto-imported from window.stx)
 * - `import { ... } from '@stacksjs/browser'` (auto-imported)
 * - `import { ... } from '@stores'` (handled by transformStoreImports)
 * - `import { ... } from '@composables'` (handled by transformStoreImports)
 */
export function hasUserImports(code: string): boolean {
  // Match all import statements
  const importRegex = /^\s*import\s+(?!type\s)/gm
  const imports = code.match(importRegex)
  if (!imports) return false

  // Check each import — is it a user import or a framework import?
  const fullImportRegex = /^\s*import\s+(?!type\s).*?\s+from\s+['"]([^'"]+)['"]/gm
  let match: RegExpExecArray | null
  while ((match = fullImportRegex.exec(code)) !== null) {
    const source = match[1]
    const isExternal = EXTERNAL_PATTERNS.some(p => p.test(source))
    if (!isExternal) {
      console.log('[stx:bundler] detected user import:', source)
      return true
    }
  }

  // Also check for bare `import 'module'` (side-effect imports)
  const sideEffectRegex = /^\s*import\s+['"]([^'"]+)['"]/gm
  while ((match = sideEffectRegex.exec(code)) !== null) {
    const source = match[1]
    const isExternal = EXTERNAL_PATTERNS.some(p => p.test(source))
    if (!isExternal) {
      console.log('[stx:bundler] detected side-effect import:', source)
      return true
    }
  }

  return false
}

/**
 * Create the Bun.build plugin that marks stx/stores as external,
 * resolves @/ paths to the project root, and — critically — rebases
 * `./` and `../` imports against the original `<script client>`
 * file's directory rather than the temp entry file's directory.
 *
 * Without the relative-import rebase, every `import { useFoo } from
 * '../../functions/foo'` in a feature page fails to resolve at
 * bundle time because the temp entry file lives under
 * `.stx/bundle-tmp/`, not next to the page source.
 */
function createBundlePlugin(projectRoot: string, templateDir: string, tmpEntry: string): BunPlugin {
  // Resolve a relative import against `templateDir`, returning the
  // first existing file with one of the standard JS/TS extensions or
  // an `index.{ts,js}` fallback. Falls back to the bare path so
  // Bun.build can surface a normal "module not found" if nothing
  // matches.
  const resolveRelative = (importer: string, request: string): string => {
    // The temp entry's importer is itself, so any `./x` from the
    // page-originated body should resolve from `templateDir`. For
    // imports inside a transitively-bundled module we honor the
    // module's own dirname — only the entry's relatives get rebased.
    const fromDir = importer === tmpEntry ? templateDir : path.dirname(importer)
    const resolved = path.resolve(fromDir, request)
    const candidates = [
      resolved,
      `${resolved}.ts`,
      `${resolved}.tsx`,
      `${resolved}.js`,
      `${resolved}.mjs`,
      `${resolved}.jsx`,
      path.join(resolved, 'index.ts'),
      path.join(resolved, 'index.tsx'),
      path.join(resolved, 'index.js'),
      path.join(resolved, 'index.mjs'),
    ]
    for (const candidate of candidates) {
      try {
        if (fs.existsSync(candidate) && fs.statSync(candidate, { throwIfNoEntry: false })?.isFile())
          return candidate
      }
      catch {}
    }
    return resolved
  }

  return {
    name: 'stx-client-bundle',
    setup(build) {
      // stx runtime — external, handled by auto-import destructuring
      build.onResolve({ filter: /^(stx|@stacksjs\/stx|@stacksjs\/browser)$/ }, (args) => ({
        path: args.path,
        external: true,
      }))

      // Stores/composables — external, handled by transformStoreImports
      build.onResolve({ filter: /^(@stores|@composables|stx\/stores)$/ }, (args) => ({
        path: args.path,
        external: true,
      }))

      // Relative imports (`./x`, `../x`) — rebase against the original
      // `<script client>` source file, not the temp entry's directory.
      build.onResolve({ filter: /^\.\.?\// }, (args) => {
        const resolved = resolveRelative(args.importer, args.path)
        return { path: resolved }
      })

      // @/ path alias → project root
      build.onResolve({ filter: /^@\// }, (args) => {
        const resolved = path.resolve(projectRoot, args.path.slice(2))
        // Try .ts, .js, /index.ts, /index.js
        const candidates = [
          resolved,
          `${resolved}.ts`,
          `${resolved}.js`,
          path.join(resolved, 'index.ts'),
          path.join(resolved, 'index.js'),
        ]
        for (const candidate of candidates) {
          if (fs.existsSync(candidate) && fs.statSync(candidate, { throwIfNoEntry: false })?.isFile()) {
            console.log('[stx:bundler] resolved @/ import:', args.path, '→', candidate)
            return { path: candidate }
          }
        }
        console.warn('[stx:bundler] could not resolve @/ import:', args.path)
        return { path: resolved }
      })
    },
  }
}

/**
 * Bundle a client script using Bun.build.
 *
 * Resolves local imports (@/, ./), npm packages, and tree-shakes unused exports.
 * stx runtime, @stores, and @composables are marked as external.
 *
 * @param code - The script content (may contain import statements)
 * @param filePath - The .stx template file path (for relative import resolution)
 * @param options - Bundling options
 * @returns Bundled code with all imports resolved and inlined
 */
export async function bundleClientScript(
  code: string,
  filePath: string,
  options: {
    projectRoot?: string
    minify?: boolean
    cacheDir?: string
  } = {},
): Promise<string> {
  const projectRoot = options.projectRoot || process.cwd()
  const minify = options.minify ?? false
  const cacheDir = options.cacheDir || path.join(projectRoot, '.stx', 'bundle-cache')

  // Content-hash for caching and temp file naming
  const hasher = new Bun.CryptoHasher('md5')
  hasher.update(code + filePath)
  const hash = hasher.digest('hex').slice(0, 12)

  // Check cache
  const cachePath = path.join(cacheDir, `${hash}.js`)
  const cacheFile = Bun.file(cachePath)
  if (await cacheFile.exists()) {
    console.log('[stx:bundler] cache hit:', hash)
    return await cacheFile.text()
  }

  // Write temp entry file (Bun.build needs a real file)
  const tmpDir = path.join(projectRoot, '.stx', 'bundle-tmp')
  const tmpEntry = path.join(tmpDir, `${hash}.ts`)
  const tmpOutDir = path.join(tmpDir, 'out', hash)

  fs.mkdirSync(tmpDir, { recursive: true })
  fs.mkdirSync(tmpOutDir, { recursive: true })

  // Resolve relative imports from the template's directory
  const templateDir = path.dirname(filePath)

  // Prevent tree-shaking: Bun.build with format:'esm' removes unexported declarations.
  // Add a catch-all export so all top-level const/let/var/function survive bundling.
  // We strip the exports from the output after bundling. Skip names that are
  // already exported — re-exporting them causes `Multiple exports with the same
  // name` errors at bundle time.
  const declNames: string[] = []
  const declRegex = /^(export\s+)?(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))/gm
  const funcRegex = /^(export\s+)?(?:async\s+)?function\s+(\w+)/gm
  let dm: RegExpExecArray | null
  while ((dm = declRegex.exec(code)) !== null) {
    if (dm[1]) continue // already exported — don't duplicate
    if (dm[2]) {
      // Destructured: const { a, b } = ...
      dm[2].split(',').forEach(n => { const t = n.split(':')[0].trim(); if (t) declNames.push(t) })
    }
    else if (dm[3]) declNames.push(dm[3])
  }
  while ((dm = funcRegex.exec(code)) !== null) {
    if (dm[1]) continue // already exported
    declNames.push(dm[2])
  }
  const exportLine = declNames.length > 0 ? `\nexport { ${declNames.join(', ')} }` : ''

  await Bun.write(tmpEntry, code + exportLine)

  console.log('[stx:bundler] bundling:', hash, 'from:', path.basename(filePath))

  try {
    const result = await Bun.build({
      entrypoints: [tmpEntry],
      outdir: tmpOutDir,
      target: 'browser',
      format: 'esm',
      minify,
      plugins: [createBundlePlugin(projectRoot, templateDir, tmpEntry)],
      define: {
        'process.env.NODE_ENV': minify ? '"production"' : '"development"',
        ...getPublicEnvDefine(),
      },
      // Anchor the bundler at the project root. The plugin above is
      // what actually rebases `./` and `../` imports against the
      // page source dir, so `root` only needs to keep the chunk
      // output path inside the project — pointing it at templateDir
      // produced "AccessDenied creating outdir
      // ../../../../../.stx/bundle-tmp" because Bun computed the out
      // dir relative to that deep template directory.
      root: projectRoot,
    })

    if (!result.success) {
      const errors = result.logs.filter(l => l.level === 'error').map(l => l.message).join(', ')
      console.warn('[stx:bundler] build failed:', errors)
      // Fall back to original code — let existing pipeline handle it
      return code
    }

    // Read the bundled output
    let bundled = ''
    for (const output of result.outputs) {
      bundled = await output.text()
      break
    }

    // Strip ESM export artifacts from the output
    // Bun.build with format: 'esm' may add `export { ... }` at the end
    bundled = bundled
      .replace(/^\s*export\s*\{[^}]*\}\s*;?\s*$/gm, '')
      .replace(/^\s*export\s+default\s+.*$/gm, '')
      .trim()

    // Strip any remaining external import statements (stx, @stores etc.)
    // These will be handled by transformAutoImports and transformStoreImports
    // Keep them as-is — the existing transforms expect to find them
    // (Actually, external imports stay as `import { x } from 'stx'` in ESM output,
    //  which is exactly what transformAutoImports needs to rewrite)

    console.log('[stx:bundler] bundled:', hash, 'output:', bundled.length, 'bytes')

    // Cache the result
    fs.mkdirSync(cacheDir, { recursive: true })
    await Bun.write(cachePath, bundled)

    return bundled
  }
  catch (error) {
    // Bun.build throws an AggregateError-like with `errors[]` for
    // resolution / compile failures; surface those messages so the
    // caller has something better than "Bundle failed" in the log.
    const msg = error instanceof Error ? error.message : String(error)
    const bunErrors = (error as { errors?: Array<{ message?: string }> })?.errors
    const detail = Array.isArray(bunErrors) && bunErrors.length > 0
      ? `\n  ${bunErrors.map(e => `- ${e?.message ?? e}`).join('\n  ')}`
      : ''
    console.warn(`[stx:bundler] error: ${msg}${detail}`)
    // Fall back to original code
    return code
  }
  finally {
    // Clean up temp files
    try {
      fs.rmSync(tmpEntry, { force: true })
      fs.rmSync(tmpOutDir, { recursive: true, force: true })
    }
    catch {}
  }
}
