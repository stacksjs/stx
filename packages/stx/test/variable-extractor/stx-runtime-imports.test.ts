import { describe, expect, it } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { processDirectives } from '../../src/process'
import { convertToCommonJS, STX_ENGINE_BINDING_NAMES } from '../../src/variable-extractor'

/**
 * `import { defineProps } from 'stx'` in a `<script server>` block — the form
 * the docs tell people to write.
 *
 * It was rewritten to `const { defineProps } = await import('stx')`, and that
 * `const` shadows the parameter of the same name that the engine passes into
 * the script. The engine's `defineProps` reads the props the renderer resolved;
 * the package's own reads `globalThis.__STX_CURRENT_PROPS__`, which nothing on
 * the server path sets. So the shadowed version returned `{}` and every
 * component rendered with empty props.
 *
 * The reason it survived: `stx` does not resolve inside this repo — the
 * published package is `@stacksjs/stx` and the root `stx` is private — so the
 * generated import rejected and the shadowing binding was never created. Only
 * a real install, where `stx` resolves, could show the bug. Reproduced before
 * the fix with `ln -s ../packages/stx node_modules/stx`.
 *
 * These assertions are on the generated code rather than on a rendered page,
 * so they hold whether or not `stx` happens to resolve where they run.
 */
describe('importing the stx runtime in a server script', () => {
  it('does not redeclare a name the engine already injects', () => {
    const out = convertToCommonJS(`import { defineProps } from 'stx'\nconst { item } = defineProps()\n`, 'test.stx')

    // The shadowing binding, in either spelling.
    expect(out).not.toContain('const { defineProps }')
    expect(out).not.toMatch(/await import\('stx'\)/)
  })

  it('emits no import at all when every name is engine-provided', () => {
    // `stx` does not resolve everywhere, and a rejected import takes the whole
    // script down — so leaving an empty import behind would trade one failure
    // for another.
    const out = convertToCommonJS(`import { defineProps, useHead } from 'stx'\nconst a = 1\n`, 'test.stx')

    expect(out).not.toContain('import(')
  })

  it('binds an aliased engine name to the injected one', () => {
    // `defineProps as dp` does not collide, so `dp` still has to exist.
    const out = convertToCommonJS(`import { defineProps as dp } from 'stx'\nconst x = dp()\n`, 'test.stx')

    expect(out).toContain('const dp = defineProps;')
    expect(out).not.toContain('import(')
  })

  it('still imports names the engine does not inject', () => {
    // `defineStore` is a real export with no injected counterpart — taking it
    // out of the import would turn a working script into a ReferenceError.
    const out = convertToCommonJS(`import { defineProps, defineStore } from 'stx'\nconst a = 1\n`, 'test.stx')

    expect(out).toContain(`await import('stx')`)
    expect(out).toContain('defineStore')
    expect(out).not.toContain('const { defineProps, defineStore }')
  })

  it('leaves imports from other modules untouched', () => {
    const out = convertToCommonJS(`import { defineProps } from './local'\nconst a = 1\n`, 'test.stx')

    expect(out).toContain('{ defineProps }')
    expect(out).toContain('import(')
  })

  it('covers @stacksjs/stx too, which is the same runtime', () => {
    const out = convertToCommonJS(`import { defineProps } from '@stacksjs/stx'\nconst a = 1\n`, 'test.stx')

    expect(out).not.toContain('import(')
  })

  it('lists the injected bindings that drive the script parameter list', () => {
    // The set is what the import rewrite consults; a name dropped from it
    // silently becomes shadowable again.
    expect(STX_ENGINE_BINDING_NAMES).toContain('defineProps')
    expect(STX_ENGINE_BINDING_NAMES).toContain('withDefaults')
    expect(new Set(STX_ENGINE_BINDING_NAMES).size).toBe(STX_ENGINE_BINDING_NAMES.length)
  })
})

describe('a component that imports defineProps end to end', () => {
  it('receives its props', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'stx-runtime-import-'))
    const componentsDir = path.join(dir, 'components')
    await mkdir(componentsDir, { recursive: true })
    await writeFile(path.join(componentsDir, 'row.stx'), `<script server>
import { defineProps } from 'stx'
const { item } = defineProps()
</script>
<template><div>[name={{ item && item.name }}]</div></template>
`)

    try {
      const result = await processDirectives(
        `<script server>\nconst items = [{ name: 'alpha' }, { name: 'beta' }]\n</script>\n@foreach(items as it)\n<Row :item="it" />\n@endforeach`,
        {},
        path.join(dir, 'page.stx'),
        { componentsDir } as any,
        new Set<string>(),
      )

      expect(result).toContain('[name=alpha]')
      expect(result).toContain('[name=beta]')
      expect(result).not.toContain('[name=]')
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
