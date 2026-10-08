/**
 * The screen's own client script, for the JavaScriptCore bundle.
 *
 * Read from the template's source rather than from the rendered page, because
 * the rendered page also carries the signals runtime, the router and the
 * reactive bridge -- thousands of lines that are not the screen's code and
 * would be shipped into the native bundle as if they were.
 *
 * Only `<script server>` runs on the server, so every other script block is
 * the screen's client code. That is the one rule here worth getting right.
 */
import type { STXDocument } from './ir'

const SCRIPT_BLOCK = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
const FUNCTION_DECLARATION = /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?function\s*\*?\s*([$\w]+)\s*\(/g
const ARROW_DECLARATION = /(?:^|\n)\s*(?:export\s+)?(?:const|let|var)\s+([$\w]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[$\w]+)\s*=>/g
const PRIMITIVE_EXPORT = /(?:^|\n)\s*(?:export\s+)?const\s+([$\w]+)\s*=\s*(-?[\d.]+|true|false|'[^']*'|"[^"]*")\s*(?=;|\n|$)/g

/**
 * Pull the client script out of a screen's source.
 *
 * `functions` is what the bundle registers as event handlers, so a name that
 * is not callable there is a handler the device cannot dispatch to.
 */
export function extractClientScript(source: string): STXDocument['script'] {
  const parts: string[] = []

  SCRIPT_BLOCK.lastIndex = 0
  for (const match of source.matchAll(SCRIPT_BLOCK)) {
    const attributes = match[1] ?? ''
    // The only script that does not reach the client.
    if (/\bserver\b/.test(attributes))
      continue
    parts.push(match[2].trim())
  }

  const code = parts.filter(Boolean).join('\n\n')
  const functions: string[] = []
  for (const pattern of [FUNCTION_DECLARATION, ARROW_DECLARATION]) {
    pattern.lastIndex = 0
    for (const match of code.matchAll(pattern))
      if (!functions.includes(match[1]))
        functions.push(match[1])
  }

  const exports: Record<string, unknown> = {}
  PRIMITIVE_EXPORT.lastIndex = 0
  for (const match of code.matchAll(PRIMITIVE_EXPORT)) {
    const raw = match[2]
    try {
      exports[match[1]] = JSON.parse(raw.replace(/^'(.*)'$/, '"$1"'))
    }
    catch {
      exports[match[1]] = raw
    }
  }

  return { exports, functions, code }
}
