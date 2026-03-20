/**
 * Script Classification
 *
 * Single source of truth for classifying `<script>` tags in `.stx` files.
 * Used by bun-plugin, dev-server, and process.ts to ensure consistent behavior.
 *
 * @module script-classifier
 */

export type ScriptType = 'signals' | 'client' | 'server'

export interface ScriptClassification {
  type: ScriptType
  /** The full <script...>...</script> tag */
  fullTag: string
  /** Just the script content (no tags) */
  content: string
  /** The script tag attributes */
  attrs: string
}

/**
 * Regex for detecting STX signals API usage in script content.
 * Matches: state(), derived(), effect(), batch(), ref(), reactive(),
 * computed(), watch(), watchEffect() — with optional generic type params.
 */
const SIGNALS_PATTERN = /\b(?:state|derived|effect|batch|ref|reactive|computed|watch|watchEffect)\s*(?:<[^>]*>)?\s*\(/

/**
 * Classify a `<script>` tag as signals, client, or server.
 *
 * Classification rules (in priority order):
 * 1. Explicit `server` attribute → server
 * 2. Uses signals API (state, derived, effect, etc.) → signals
 * 3. Has `client` attribute, `type="module"`, or `src=` → client
 * 4. Everything else → server (executed at build time for variable extraction)
 */
export function classifyScript(attrs: string, content: string, fullTag: string): ScriptClassification {
  const result = { fullTag, content, attrs }

  // 1. Explicit server attribute always wins
  if (/\bserver\b/.test(attrs)) {
    return { ...result, type: 'server' }
  }

  // 2. Already processed scripts are skipped entirely
  if (/\bdata-stx-scoped\b/.test(attrs)) {
    return { ...result, type: 'client' }
  }

  // 3. Signals API usage → signals (kept in template for runtime processing)
  if (SIGNALS_PATTERN.test(content)) {
    return { ...result, type: 'signals' }
  }

  // 4. Explicit client markers
  if (/\bclient\b/.test(attrs) || /\btype\s*=\s*["']module["']/.test(attrs) || /\bsrc\s*=/.test(attrs)) {
    return { ...result, type: 'client' }
  }

  // 5. Default: server script (variables extracted for template use)
  return { ...result, type: 'server' }
}

/**
 * Classify all `<script>` tags in a template.
 *
 * Returns arrays of scripts grouped by type.
 */
export function classifyAllScripts(content: string): {
  signals: ScriptClassification[]
  client: ScriptClassification[]
  server: ScriptClassification[]
} {
  const signals: ScriptClassification[] = []
  const client: ScriptClassification[] = []
  const server: ScriptClassification[] = []

  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null

  while ((match = scriptRegex.exec(content)) !== null) {
    const classification = classifyScript(match[1], match[2], match[0])

    switch (classification.type) {
      case 'signals':
        signals.push(classification)
        break
      case 'client':
        client.push(classification)
        break
      case 'server':
        server.push(classification)
        break
    }
  }

  return { signals, client, server }
}
