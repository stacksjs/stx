/**
 * Script Classification
 *
 * Single source of truth for classifying `<script>` tags in `.stx` files.
 * Used by bun-plugin, dev-server, and process.ts to ensure consistent behavior.
 *
 * @module script-classifier
 */

import { matchHtmlComment, matchScriptElement } from './html-masking'

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
 * Splits a well-formed `<script …>…</script>` element into its attributes and
 * inner content. Safe to apply greedily: {@link matchScriptElement} ends the
 * element at its FIRST `</script>`, so `fullTag` holds exactly one close tag.
 */
const SCRIPT_PARTS = /^<script\b([^>]*)>([\s\S]*)<\/script\s*>$/i

/**
 * Classify all `<script>` tags in a template.
 *
 * The scan walks the template rather than running a global regex so that HTML
 * comments are inert. A comment whose prose merely mentions a script tag — e.g.
 * `<!-- the <script server> block owner-scopes the switcher -->` — used to be
 * matched as a REAL opening tag, and the non-greedy regex then ran on to the
 * next `</script>`. The resulting bogus `fullTag` spanned from inside the comment
 * to the end of an unrelated script, so callers that delete `fullTag`
 * (app-shell's `cleanTemplate`, serve-app's `templateContent`) erased the
 * comment's `-->` terminator AND every real script in between — producing a
 * runaway comment node that swallowed the rest of the document.
 *
 * `<template>` contents are deliberately still scanned: stx SFC files wrap their
 * whole markup in `<template>`, and callers rely on scripts authored inside it
 * being classified so they can be stripped from the rendered output.
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

  let i = 0
  while (i < content.length) {
    const lt = content.indexOf('<', i)
    if (lt === -1)
      break

    // Skip the whole comment, script tags in its prose included.
    const commentEnd = matchHtmlComment(content, lt)
    if (commentEnd > lt) {
      i = commentEnd
      continue
    }

    const scriptEnd = matchScriptElement(content, lt)
    if (scriptEnd > lt) {
      const fullTag = content.slice(lt, scriptEnd)
      const parts = SCRIPT_PARTS.exec(fullTag)
      if (parts) {
        const classification = classifyScript(parts[1], parts[2], fullTag)

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
      i = scriptEnd
      continue
    }

    // An unterminated `<!--` is malformed markup. Resume scanning just past the
    // marker instead of treating the rest of the file as comment text, so a
    // genuine trailing script is still classified (and still stripped) rather
    // than leaking server code into the response.
    i = lt + (content.startsWith('<!--', lt) ? '<!--'.length : 1)
  }

  return { signals, client, server }
}
