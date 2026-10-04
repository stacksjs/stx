/**
 * `stx-module.d.ts` declares exactly what `import { … } from 'stx'` binds
 * (stacksjs/stx#2028).
 *
 * The file is hand-written and copied verbatim into dist/ and into the VS Code
 * extension, and for an author it is the whole contract of the specifier. It is
 * checked here against the two lists the runtime itself uses - what the client
 * destructures off window.stx and what the server engine passes in - so a name
 * added to either surfaces here rather than as "has no exported member" on code
 * that runs, and a name dropped from both surfaces here rather than as an
 * import that type-checks and then binds undefined.
 */
import { describe, expect, it } from 'bun:test'
import { STX_ENGINE_BINDING_NAMES } from '../src/engine-bindings'
import { STX_RUNTIME_GLOBALS } from '../src/runtime-globals'
import { STX_CLIENT_MODULE_EXPORTS, STX_MODULE_EXPORTS, STX_SERVER_MODULE_EXPORTS, stxImportDiagnostics } from '../src/stx-module-imports'
import { extractScriptBlocks } from '../src/stx-virtual-ts'

const moduleDeclaration = await Bun.file(new URL('../stx-module.d.ts', import.meta.url)).text()
const runtimeDeclaration = await Bun.file(new URL('../stx.d.ts', import.meta.url)).text()
const packageJson = await Bun.file(new URL('../package.json', import.meta.url)).json()

/** `export const NAME: TYPE` lines inside `declare module 'stx'`. */
function exportedValues(): Map<string, string> {
  const body = /declare module 'stx' \{([\s\S]*)\}\s*$/.exec(moduleDeclaration)?.[1] ?? ''
  return new Map([...body.matchAll(/^\s*export const ([\w$]+): (.+?)(?:\s*\/\/.*)?$/gm)].map(m => [m[1], m[2]]))
}

describe('stx-module.d.ts', () => {
  it('exports every name either script path binds, and nothing else', () => {
    expect([...exportedValues().keys()].sort()).toEqual([...STX_MODULE_EXPORTS])
  })

  it('is the union of the client and server surfaces', () => {
    // The client surface IS the window.stx destructure; the server surface is
    // the engine's parameters minus the JavaScript environment.
    expect([...STX_CLIENT_MODULE_EXPORTS]).toEqual([...STX_RUNTIME_GLOBALS].sort())
    for (const name of STX_SERVER_MODULE_EXPORTS)
      expect(STX_ENGINE_BINDING_NAMES as readonly string[]).toContain(name)
    for (const environment of ['console', 'window', 'document', 'require', 'module', 'exports', 'fetch'])
      expect(STX_MODULE_EXPORTS).not.toContain(environment)
  })

  it('marks exactly the server-only names', () => {
    const marked = moduleDeclaration.split('\n')
      .filter(line => line.includes('// <script server> only'))
      .map(line => /export const ([\w$]+)/.exec(line)![1])
      .sort()
    expect(marked).toEqual(STX_SERVER_MODULE_EXPORTS.filter(name => !STX_CLIENT_MODULE_EXPORTS.includes(name)))
  })

  it('types each value by the stx.d.ts global of the same name, not by a second copy', () => {
    const functions = new Set([...runtimeDeclaration.matchAll(/^declare function\s+([\w$]+)/gm)].map(m => m[1]))
    for (const [name, type] of exportedValues()) {
      const global = /^typeof globalThis\.([\w$]+)$/.exec(type)?.[1]
      if (global) {
        expect(global).toBe(name)
        // `typeof globalThis.x` only finds a FUNCTION or `var`; a `const`
        // global would make this an error in the declaration file.
        expect(functions.has(name)).toBe(true)
      }
      else {
        // Only the server-only names, which stx.d.ts does not declare.
        expect(STX_CLIENT_MODULE_EXPORTS).not.toContain(name)
      }
    }
  })

  it('re-exports only types stx.d.ts declares', () => {
    const declared = new Set([...runtimeDeclaration.matchAll(/^(?:interface|type)\s+(\w+)/gm)].map(m => m[1]))
    const aliases = [...moduleDeclaration.matchAll(/^\s*export type (\w+)(<[^>]*>)? = globalThis\.(\w+)/gm)]
    expect(aliases.length).toBeGreaterThan(10)
    for (const [, name, , target] of aliases) {
      expect(target).toBe(name)
      expect(declared.has(name)).toBe(true)
    }
  })

  it('references stx.d.ts and ships with the package', () => {
    expect(moduleDeclaration.startsWith('/// <reference path="./stx.d.ts" />')).toBe(true)
    expect(packageJson.files).toContain('stx-module.d.ts')
    expect(packageJson.files).toContain('stx.d.ts')
  })
})

describe('stxImportDiagnostics', () => {
  const diagnose = (source: string) => stxImportDiagnostics(source, extractScriptBlocks(source))

  it('reports a server-only name in a client block at the name', () => {
    const source = '<div></div>\n<script client>\nimport { state, useServerData } from \'stx\'\n</script>'
    const [diagnostic, ...rest] = diagnose(source)
    expect(rest).toEqual([])
    expect(diagnostic).toMatchObject({ line: 3, column: 17, length: 'useServerData'.length, name: 'useServerData', kind: 'client' })
    expect(source.slice(diagnostic.offset, diagnostic.offset + diagnostic.length)).toBe('useServerData')
  })

  it('reports a client-only name in a server block, multi-line lists and aliases included', () => {
    const source = '<script server>\nimport {\n  defineProps,\n  useQuery as query,\n} from "stx"\n</script>'
    expect(diagnose(source).map(d => [d.name, d.line, d.column, d.kind])).toEqual([['useQuery', 4, 3, 'server']])
  })

  it('treats a bare <script> as a client block', () => {
    expect(diagnose('<script>\nimport { notFound } from \'stx\'\n</script>').map(d => d.kind)).toEqual(['plain'])
  })

  it('leaves type imports, other modules and names the module does not export alone', () => {
    const source = [
      '<script client>',
      'import type { StxSignal } from \'stx\'',
      'import { type StxRef, state } from \'stx\'',
      'import { useServerData } from \'@stacksjs/stx\'',
      'import { useForm } from \'stx\'',
      '</script>',
    ].join('\n')
    // `useForm` is TypeScript's to report (TS2305): it is not in the module.
    expect(diagnose(source)).toEqual([])
  })
})
