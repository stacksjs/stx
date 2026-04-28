/**
 * Public env exposure for client bundles
 *
 * Mirrors the server-side `$env` template context (process.ts:762) onto the
 * client side via build-time substitution. Any env var matching `envPrefix`
 * (default `STX_PUBLIC_`) gets inlined as `import.meta.env.STX_PUBLIC_*` in
 * scripts bundled for the browser.
 *
 *   .env:    STX_PUBLIC_API_URL=https://api.example.com
 *   store:   const api = import.meta.env.STX_PUBLIC_API_URL
 *   built:   const api = "https://api.example.com"
 *
 * Vite-style. Build-time, zero runtime cost.
 */

import process from 'node:process'

/**
 * Build the `define` map every client bundler/transpiler should pass to
 * Bun.build / new Bun.Transpiler({ define }).
 *
 * Returns substitutions for both `import.meta.env.<KEY>` (preferred, Vite-
 * compatible) and a single `import.meta.env` literal that maps to the full
 * object so consumers can do `if (import.meta.env.X)` and similar idiomatic
 * patterns.
 */
export function getPublicEnvDefine(envPrefix: string = 'STX_PUBLIC_'): Record<string, string> {
  const define: Record<string, string> = {}
  const envObject: Record<string, string> = {}

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith(envPrefix) || value === undefined)
      continue
    define[`import.meta.env.${key}`] = JSON.stringify(value)
    envObject[key] = value
  }

  // Whole-object substitution lets `Object.keys(import.meta.env)` and similar
  // dynamic patterns work, not just direct key access.
  define['import.meta.env'] = JSON.stringify(envObject)

  return define
}

/**
 * Get the public env values as a plain object. Useful for places that want
 * the raw map (e.g. tests, debugging) rather than the define-shaped strings.
 */
export function getPublicEnv(envPrefix: string = 'STX_PUBLIC_'): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(envPrefix) && value !== undefined)
      out[key] = value
  }
  return out
}
