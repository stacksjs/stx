import { hasTopLevelAwait } from './client-parameter-bindings'
import { LRUCache } from './performance-utils'

// A page can contain more than a hundred module bodies, including bundles
// larger than the lexical-analysis cache accepts. Retain the final decision
// so subsequent requests do not repeat scope analysis and parser validation.
// Keys are the exact source, so edits invalidate naturally. Bound both the
// working set and retained UTF-16 source bytes; never cache parser failures.
const decisions = new LRUCache<string, { source: string, asynchronous: boolean }>(256, {
  maxBytes: 16 * 1024 * 1024,
  sizeOf: value => value.source.length * 2,
})

/** Ask the compiler parser whether a valid, import-free body needs async scope. */
export function requiresAsyncBody(code: string): boolean {
  const cached = decisions.get(code)
  if (cached) return cached.asynchronous
  const asynchronous = parseAsyncBody(code)
  decisions.set(code, { source: code, asynchronous })
  return asynchronous
}

function parseAsyncBody(code: string): boolean {
  const parser = new Bun.Transpiler({ loader: 'js' })
  if (hasTopLevelAwait(code)) {
    parser.transformSync(`(async function(){\n${code}\n})()`);
    return true
  }
  try { parser.transformSync(`(function(){\n${code}\n})()`); return false }
  catch {
    // Only accept the async alternative when it parses; malformed source must
    // still fail rather than being relabelled as an asynchronous module.
    parser.transformSync(`(async function(){\n${code}\n})()`)
    return true
  }
}
