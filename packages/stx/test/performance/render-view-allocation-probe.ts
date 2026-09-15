/**
 * Count the bytes of string storage an unchanged `renderView` materialises
 * (stacksjs/stx#1945).
 *
 * ## Why this exists rather than reading a counter
 *
 * Nothing Bun exposes measures cumulative allocation. Measured directly on this
 * build: churning ~200MB of garbage strings moved `heapStats().heapSize` by
 * ZERO bytes, and `mimalloc.malloc_normal.total` / `malloc_requested.total` are
 * hard 0 because mimalloc's stat counters are not compiled in. `rss`,
 * `jsc.currentCommit` and `heapSize` are allocator high-water or post-GC
 * retention — they answer "how much is held", never "how much was produced".
 * An interposed macOS malloc probe misses it too, because JSC allocates through
 * its own allocator rather than system malloc.
 *
 * So this instruments the operations themselves: every `String.prototype` method
 * that returns a NEW string is wrapped, and the length of each result that is
 * not the receiver is summed. The count is deterministic — same input, same
 * number, no GC timing in it.
 *
 * ## What it does and does not see
 *
 * SEES: slice, substring, replace, replaceAll, concat, toLowerCase, toUpperCase,
 * trim family, padStart/End, repeat, normalize, split (per element), join on
 * arrays of strings is NOT a String method and is not seen.
 *
 * DOES NOT SEE:
 *   - `a + b` and template literals. JSC represents these as ROPES: O(1), no
 *     copy, flattened later inside the engine where no JS-visible call happens.
 *     A change that trades `slice + concat` for a template literal can therefore
 *     move work out of this counter without removing it. Treat a large drop with
 *     suspicion unless latency moved the same way.
 *   - object, array and Map allocation
 *   - compiled code objects from `new Function`
 *   - anything inside native code (Bun.Transpiler, Bun.build)
 *
 * ## It counts materialised CONTENT, not allocated BYTES
 *
 * A large `slice` allocates nothing. JSC backs it with a substring that shares
 * the parent's buffer, and a concatenation is a rope that holds its operands
 * without copying them. The bytes are allocated later, when something forces
 * the rope FLAT -- a regex, an indexOf, anything that needs contiguous
 * characters. Measured on this build by `string-cost-model.ts`, sitting next to
 * this file:
 *
 *     20 large slices, 763MB of "content"      rss +0.4MB
 *     20 concatenations, left unflattened      rss +0.1MB
 *     the same 20 concatenations, flattened    rss +742MB
 *
 * So this counter attributes bytes to the slice that produced them, while the
 * machine pays at the flatten that consumes them. It stays a useful proxy
 * because of the shape the pipeline actually has: a stage splices a document as
 * `slice + insert + slice`, the next stage reads it and forces the flatten, and
 * the slices it counted sum to roughly the length that then gets allocated. One
 * counted document is about one allocated document.
 *
 * The proxy misleads in two directions, and both matter when reading a diff:
 *
 *   - AVOIDING A LARGE SLICE IS NOT A WIN. Holding a string to skip re-slicing
 *     it out of a document drops this counter by the slice's length and saves
 *     nothing, because the slice was free. Optimise away whole-document
 *     REBUILDS, scans, and regex passes -- work the engine has to do -- not
 *     slice arithmetic.
 *   - A rope built from many small pieces and flattened repeatedly costs more
 *     than this counter shows.
 *
 * It is therefore a measure of EXPLICIT STRING MATERIALISATION, which is the
 * category #1945's work targets, not a total heap figure, and not a count of
 * allocated bytes. Reported as such. LATENCY IS THE GROUND TRUTH: a drop here
 * that is not matched by `render-view-allocation.bench.ts` moving the same way
 * has not removed work, only moved it out of view.
 */
import path from 'node:path'

export interface AllocationProbe {
  /** Total bytes of new string storage produced while recording. */
  bytes: number
  /** How many new strings were produced. */
  count: number
  /** Per-call-site totals, only when `attribute` is on. */
  sites: Map<string, { bytes: number, count: number }>
}

const NEW_STRING_METHODS = [
  'slice', 'substring', 'substr', 'replace', 'replaceAll', 'concat',
  'toLowerCase', 'toUpperCase', 'toLocaleLowerCase', 'toLocaleUpperCase',
  'trim', 'trimStart', 'trimEnd', 'padStart', 'padEnd', 'repeat', 'normalize',
] as const

let recording = false
let probe: AllocationProbe = { bytes: 0, count: 0, sites: new Map() }
let attribute = false
let installed = false

/** Wrap the String methods once. Idempotent. */
export function installAllocationProbe(): void {
  if (installed)
    return
  installed = true

  for (const name of NEW_STRING_METHODS) {
    const original = (String.prototype as any)[name]
    if (typeof original !== 'function')
      continue
    Object.defineProperty(String.prototype, name, {
      value: function (this: string, ...args: any[]) {
        const out = original.apply(this, args)
        // `out !== this` is the whole test: a non-matching replace, a slice(0)
        // and a trim with nothing to trim all hand back the SAME string, which
        // costs nothing and must not be counted.
        if (recording && typeof out === 'string' && out !== this) {
          probe.bytes += out.length
          probe.count++
          if (attribute) {
            // Bookkeeping is done with recording OFF. Reading a stack frame
            // calls split() and trim(), which are wrapped — left on, the probe
            // would measure itself and inflate every attributed run.
            recording = false
            try {
              const frame = ((new Error().stack || '').split('\n')[2] || '?').trim()
              const entry = probe.sites.get(frame) || { bytes: 0, count: 0 }
              entry.bytes += out.length
              entry.count++
              probe.sites.set(frame, entry)
            }
            finally {
              recording = true
            }
          }
        }
        return out
      },
      writable: true,
      configurable: true,
    })
  }

  // split() returns an array of new strings; count them without per-element
  // stack capture, which would dominate the cost of the split itself.
  const originalSplit = String.prototype.split
  Object.defineProperty(String.prototype, 'split', {
    value: function (this: string, ...args: any[]) {
      const out = originalSplit.apply(this, args)
      if (recording && Array.isArray(out)) {
        for (const part of out) {
          if (typeof part === 'string' && part !== this) {
            probe.bytes += part.length
            probe.count++
          }
        }
      }
      return out
    },
    writable: true,
    configurable: true,
  })
}

/** Run `fn` with the probe recording, and return what it produced. */
export async function measureAllocation<T>(
  fn: () => Promise<T>,
  opts: { attribute?: boolean } = {},
): Promise<{ result: T, probe: AllocationProbe }> {
  installAllocationProbe()
  probe = { bytes: 0, count: 0, sites: new Map() }
  attribute = opts.attribute === true
  recording = true
  try {
    const result = await fn()
    return { result, probe }
  }
  finally {
    recording = false
    attribute = false
  }
}

// ── CLI ──────────────────────────────────────────────────────────────────────

if (import.meta.main) {
  const { renderView } = await import('../../src/build-views')
  const root = path.resolve(import.meta.dir, '../../../..')
  const page = path.join(root, 'packages/components/examples/sidebar-arc-spaces.stx')
  const options = { componentsDir: path.join(root, 'packages/components/src/ui/sidebar') }
  const warmups = Number(process.env.STX_BENCH_WARMUPS ?? 10)
  const showSites = process.env.STX_BENCH_SITES === '1'

  // Warm first: module loading, the client-script bundler's disk cache and the
  // signals-runtime cache all allocate once and would swamp a single sample.
  let html = await renderView(page, {}, options)
  for (let i = 0; i < warmups; i++)
    html = await renderView(page, {}, options)

  const { probe: measured } = await measureAllocation(
    () => renderView(page, {}, options),
    { attribute: showSites },
  )

  const digest = (s: string) => new Bun.CryptoHasher('sha256')
    .update(s.replace(/<meta name="stx-build" content="[^"]*"\s*\/?>/g, '<meta name="stx-build" content="MASKED">'))
    .digest('hex')

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({
    metric: 'explicit string materialisation via String.prototype, one steady-state render (a proxy for allocation, not allocated bytes -- see the module comment)',
    fixture: path.relative(root, page),
    outputBytes: Buffer.byteLength(html),
    outputSha256: digest(html),
    allocatedBytes: measured.bytes,
    allocatedStrings: measured.count,
    bytesPerOutputByte: +(measured.bytes / Buffer.byteLength(html)).toFixed(2),
  }, null, 2))

  if (showSites) {
    const rows = [...measured.sites.entries()].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 20)
    for (const [site, entry] of rows) {
      // eslint-disable-next-line no-console
      console.log(`${(entry.bytes / 1024).toFixed(0).padStart(8)}KB  x${String(entry.count).padStart(5)}  ${site.replace(root, '').slice(0, 96)}`)
    }
  }
}
