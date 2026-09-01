/**
 * Does a client script reach signal APIs through a module it imports?
 *
 * Every signal decision in the pipeline is a syntactic scan for `state(`,
 * `derived(`, `effect(` and friends in the script's own text. That is exact
 * for a script that declares its own signals and blind to one that factors
 * them out:
 *
 * ```stx
 * <script client>
 *   import { makeProbe } from '../functions/probe-factory'
 *   const { signal } = makeProbe()   // <- names no signal API
 * </script>
 * ```
 *
 * With no match, the page is treated as static: `{{ signal() }}` is evaluated
 * server-side (undefined, so empty), no setup function is generated, and
 * `<body>` gets no `data-stx` for the runtime to invoke. Nothing logs. The
 * page renders its static half and every binding is inert, which reads as a
 * data problem rather than a hydration one. stacksjs/stacks#2394.
 *
 * The bundler resolves this authoritatively, but it is async and expensive,
 * and the gate that decides whether to preserve `{{ }}` for the client is
 * synchronous and runs once per template, partial and component. So this walks
 * the same edges the bundler would, cheaply: read the imported file, look for
 * the same API calls, recurse a bounded distance.
 *
 * Deliberately a subset of what bundling sees - relative specifiers only, a
 * few levels deep. Anything it misses is caught later by the async
 * bundle-and-retest in signal-processing.ts, which can only ever be MORE
 * permissive. The reverse (a gate that says signals where the setup pass finds
 * none) would leave a literal mustache on the page, so the two must lean this
 * way round.
 *
 * @module imported-signals
 */

import fs from 'node:fs'
import path from 'node:path'

/**
 * The signal-creating calls. Kept in sync with the detectors in
 * expressions.ts and signal-processing.ts by being the same shape: a call to
 * one of the reactive primitives, optionally with a type argument.
 */
const SIGNAL_API_CALL = /\b(?:state|derived|effect|ref|reactive|computed|watch|watchEffect)\s*(?:<[^<>()]*>)?\s*\(/

/**
 * Specifiers a script can reach that resolve to a file we can read.
 *
 * `export … from` as well as `import`: a barrel that re-exports the real
 * module is the ordinary way to arrange this, and stopping at one would make
 * the answer depend on whether the author used an index file.
 */
const RELATIVE_IMPORT = /(?:^|\n)\s*(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"](\.[^'"]*)['"]/g

/** Extensions tried in order, matching how the bundler resolves a bare path. */
const EXTENSIONS = ['', '.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs', '/index.ts', '/index.js']

/** How far to follow the import chain. A composable importing a composable is normal; five hops is not. */
const MAX_DEPTH = 3

function resolveImport(specifier: string, fromFile: string): string | null {
  const base = path.resolve(path.dirname(fromFile), specifier)

  for (const extension of EXTENSIONS) {
    const candidate = base + extension
    try {
      if (fs.statSync(candidate).isFile())
        return candidate
    }
    catch {
      // Not this one.
    }
  }

  return null
}

/**
 * Whether `script` declares signals somewhere in the modules it imports.
 *
 * `fromFile` is the file the script lives in; without it nothing can be
 * resolved and this returns false, which is the pre-existing behaviour.
 */
export function importsSignalDeclarations(
  script: string,
  fromFile: string | undefined,
  depth = 0,
  seen: Set<string> = new Set(),
): boolean {
  if (!fromFile || depth >= MAX_DEPTH)
    return false

  for (const match of script.matchAll(RELATIVE_IMPORT)) {
    const resolved = resolveImport(match[1], fromFile)
    if (!resolved || seen.has(resolved))
      continue

    seen.add(resolved)

    let source: string
    try {
      source = fs.readFileSync(resolved, 'utf8')
    }
    catch {
      continue
    }

    if (SIGNAL_API_CALL.test(source))
      return true

    // A barrel file re-exporting the real module is one hop, not a dead end.
    if (importsSignalDeclarations(source, resolved, depth + 1, seen))
      return true
  }

  return false
}
