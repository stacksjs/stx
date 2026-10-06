/**
 * What `import { … } from 'stx'` really provides, and where it does not.
 *
 * `stx` is not a package. No module by that name is installed in an app (the
 * npm package called `stx` is an unrelated one), so the specifier only works
 * because both script paths intercept it before anything resolves it:
 *
 *  - **Client blocks** (`<script client>` and bare `<script>`): the import is
 *    stripped (`stripStxRuntimeImports`) and the names are destructured off
 *    `window.stx` instead, by `buildRuntimeGlobalsDestructure`. Only
 *    {@link STX_RUNTIME_GLOBALS} are destructured, so any other name is
 *    `undefined` in the browser.
 *  - **Server blocks**: names in {@link STX_ENGINE_BINDING_NAMES} are taken out
 *    of the import because the engine passes them in as parameters. Anything
 *    left becomes `await import('stx')`, which rejects, and a rejected import
 *    takes the whole server script down with it.
 *
 * So the module has two surfaces, one per block kind, and a checker that hands
 * every block the whole of `@stacksjs/stx` blesses imports that fail at runtime.
 * `stx-module.d.ts` declares the union of the two, typed off the globals in
 * `stx.d.ts`, and {@link stxImportDiagnostics} reports a name imported into the
 * kind of block that does not get it. A buffer per block would let TypeScript
 * do the second half itself, but the editor has one buffer per file.
 *
 * @module stx-module-imports
 */

import type { ScriptBlock, ScriptKind } from './stx-virtual-ts'
import { STX_ENGINE_BINDING_NAMES } from './engine-bindings'
import { STX_RUNTIME_GLOBALS } from './runtime-globals'

/**
 * Engine bindings that are the JavaScript environment, or engine plumbing,
 * rather than stx API. They are parameters of a server script like the rest,
 * but importing the console or `window` from `stx` is not something to bless,
 * so the module does not declare them.
 */
const ENVIRONMENT_BINDINGS = new Set([
  'module', 'exports', 'require', '$bool', '$num',
  'window', 'document', 'console', 'confirm', 'alert', 'fetch',
])

/** Names `import { … } from 'stx'` binds in a `<script server>` block. */
export const STX_SERVER_MODULE_EXPORTS: readonly string[] = STX_ENGINE_BINDING_NAMES
  .filter(name => !ENVIRONMENT_BINDINGS.has(name))
  .sort()

/** Names `import { … } from 'stx'` binds in a client block. */
export const STX_CLIENT_MODULE_EXPORTS: readonly string[] = [...STX_RUNTIME_GLOBALS].sort()

/** Every value `stx-module.d.ts` exports: what at least one block kind gets. */
export const STX_MODULE_EXPORTS: readonly string[] = [...new Set([...STX_SERVER_MODULE_EXPORTS, ...STX_CLIENT_MODULE_EXPORTS])].sort()

const SERVER = new Set(STX_SERVER_MODULE_EXPORTS)
const CLIENT = new Set(STX_CLIENT_MODULE_EXPORTS)
const EXPORTED = new Set(STX_MODULE_EXPORTS)

/** A name imported from `stx` into a block that does not receive it. */
export interface StxImportDiagnostic {
  /** 1-based line and column in the `.stx` file. */
  line: number
  column: number
  /** Offset in the `.stx` file, and the length of the imported name. */
  offset: number
  length: number
  name: string
  kind: ScriptKind
  message: string
}

/**
 * The value import declarations from `stx` in a block body. Multi-line lists
 * are common (formatters expand them), so the body is matched across lines.
 * `import type { … }` is skipped whole: types are erased, and every type the
 * module exports is a declaration rather than a runtime binding.
 */
const STX_IMPORT_RE = /\bimport\s+(?!type[\s{])\{([^}]*)\}\s*from\s*(['"])stx\2/g

function messageFor(name: string, kind: ScriptKind): string {
  if (kind === 'server') {
    return `'${name}' is not provided by 'stx' in a <script server> block. The engine binds only its own names there `
      + `(defineProps, state, useHead, ...); any other name becomes \`await import('stx')\`, which does not resolve, `
      + `so the whole script fails when the page renders. Import it from '@stacksjs/stx' instead.`
  }
  return `'${name}' is not provided by 'stx' in a client <script> block. The import is replaced by the window.stx runtime, `
    + `which has no '${name}', so it is undefined in the browser.`
}

/**
 * Names imported from `stx` into a block kind that does not receive them.
 *
 * A name the module does not export at all is left alone: TypeScript already
 * reports it (TS2305), and saying it twice helps nobody.
 */
export function stxImportDiagnostics(source: string, blocks: readonly ScriptBlock[]): StxImportDiagnostic[] {
  const diagnostics: StxImportDiagnostic[] = []

  for (const block of blocks) {
    if (block.offset === undefined)
      continue
    const provided = block.kind === 'server' ? SERVER : CLIENT

    STX_IMPORT_RE.lastIndex = 0
    for (const match of block.code.matchAll(STX_IMPORT_RE)) {
      const listStart = match.index! + match[0].indexOf('{') + 1
      for (const specifier of match[1].matchAll(/[^,]+/g)) {
        const text = specifier[0]
        // `type X` inside a value import is erased like `import type`.
        if (/^\s*type\s/.test(text))
          continue
        const imported = /^\s*([A-Za-z_$][\w$]*)/.exec(text)
        if (!imported)
          continue
        const name = imported[1]
        if (!EXPORTED.has(name) || provided.has(name))
          continue

        const offset = block.offset + listStart + specifier.index! + imported[0].length - name.length
        const before = source.slice(0, offset)
        const line = before.split('\n').length
        diagnostics.push({
          line,
          column: offset - (before.lastIndexOf('\n') + 1) + 1,
          offset,
          length: name.length,
          name,
          kind: block.kind,
          message: messageFor(name, block.kind),
        })
      }
    }
  }

  return diagnostics
}
