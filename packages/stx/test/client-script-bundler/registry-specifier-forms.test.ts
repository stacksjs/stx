/**
 * Registry imports are rewritten whichever form Bun printed them in.
 *
 * The bundler sends a script's direct imports to the page registry by
 * resolving them to `{ path: "stx-module:<id>", external: true }`. Bun 1.4
 * prints that path in the bundle. Bun 1.3 prints the specifier the source was
 * written with instead, so rewriteRegistryImports — which only knows the
 * `stx-module:` form — matched nothing, and every import reached the browser as
 * a bare ES import inside a classic script: "Cannot use import statement
 * outside a module", and a page where nothing hydrated.
 *
 * CI runs one Bun, so the 1.3 shape is fed in directly here rather than left to
 * whichever version happens to be installed.
 */
import { describe, expect, it } from 'bun:test'
import { hasUserImports, normalizeRegistrySpecifiers, rewriteRegistryImports } from '../../src/client-script-bundler'

const registered = new Map([
  ['./first', 'stx-module:resources/first.ts'],
  ['../functions/native-tabs', 'stx-module:resources/functions/native-tabs.ts'],
  ['@stacksjs/mobile', 'stx-module:npm:@stacksjs/mobile'],
])

/** What Bun 1.3 emitted: the specifiers exactly as the source wrote them. */
const BUN_13_OUTPUT = [
  `import { shared } from "./first";`,
  `import { activeTabFor } from "../functions/native-tabs";`,
  `import { device, isNativeMobile } from '@stacksjs/mobile';`,
  `import "@stacksjs/mobile";`,
  `import { state } from "stx";`,
  `var firstValue = shared;`,
].join('\n')

describe('normalizeRegistrySpecifiers', () => {
  it('maps the written specifiers onto their registry paths', () => {
    const out = normalizeRegistrySpecifiers(BUN_13_OUTPUT, registered)

    expect(out).toContain(`from "stx-module:resources/first.ts"`)
    expect(out).toContain(`from "stx-module:resources/functions/native-tabs.ts"`)
    expect(out).toContain(`from 'stx-module:npm:@stacksjs/mobile'`)
    expect(out).toContain(`import "stx-module:npm:@stacksjs/mobile"`)
  })

  it('leaves imports the plugin did not send to the registry alone', () => {
    // stx is resolved to the runtime by a later pass that expects this form.
    expect(normalizeRegistrySpecifiers(BUN_13_OUTPUT, registered)).toContain(`import { state } from "stx";`)
  })

  it('leaves code that is not an import statement alone', () => {
    const code = `const note = 'import from "./first" is a string';\nvar x = "./first";`
    expect(normalizeRegistrySpecifiers(code, registered)).toBe(code)
  })

  it('is a no-op on Bun 1.4 output, which already carries the registry path', () => {
    const bun14 = `import { shared } from "stx-module:resources/first.ts";`
    expect(normalizeRegistrySpecifiers(bun14, registered)).toBe(bun14)
  })

  it('leaves no bare import once the registry rewrite runs on 1.3 output', () => {
    const reads: string[] = []
    const out = rewriteRegistryImports(normalizeRegistrySpecifiers(BUN_13_OUTPUT, registered), reads)

    // Only the runtime import is left, for the auto-import pass to replace.
    expect(out.match(/^[ \t]*import\b.*$/gm)).toEqual([`import { state } from "stx";`])
    expect(reads.join('\n')).toContain(`globalThis.__stxModules["resources/first.ts"]`)
    expect(reads.join('\n')).toContain(`globalThis.__stxModules["npm:@stacksjs/mobile"]`)
    expect(reads.join('\n')).toContain('var device = ')
  })
})

/**
 * Bun prints a side-effect import with no space after `import`, both from the
 * transpiler and in a bundle: `import"stx-module:resources/functions/steps.ts";`.
 * Every pass matched `import\s+`, so the script was not bundled at all, or its
 * bundle kept the raw import and the component's scope never registered.
 */
describe('side-effect imports printed without a space', () => {
  it('counts as a user import, so the script is bundled', () => {
    expect(hasUserImports(`import"../functions/steps";\nconst a = 1`)).toBe(true)
    expect(hasUserImports(`import"stx";`)).toBe(false)
  })

  it('maps the written specifier onto its registry path', () => {
    const out = normalizeRegistrySpecifiers(`import"./first";`, registered)
    expect(out).toBe(`import"stx-module:resources/first.ts";`)
  })

  it('becomes a registry presence check, leaving no import behind', () => {
    const reads: string[] = []
    const out = rewriteRegistryImports(`import"stx-module:resources/functions/steps.ts";\nvar a = 1;`, reads)

    expect(out).not.toContain('import')
    expect(reads.join('\n')).toContain(`globalThis.__stxModules["resources/functions/steps.ts"]`)
  })

  it('still binds a named import printed without spaces', () => {
    const reads: string[] = []
    const out = rewriteRegistryImports(`import{X as o}from"stx-module:resources/functions/steps.ts";`, reads)

    expect(out.trim()).toBe('')
    expect(reads.join('\n')).toContain('var o = __stxMod0["X"];')
  })
})
