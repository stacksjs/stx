import { describe, expect, it, beforeAll } from 'bun:test'
import { processDirectives } from '../../src/process'
import { join } from 'node:path'
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'

/**
 * Regression tests for passing loop variables as object props to a component
 * inside `@foreach`.
 *
 * Loop iterations serialise prop values into a `__stx_` attribute so the
 * component directive can read them after the loop context is gone. The
 * original serialisation HTML-entity-escaped the JSON, but `\"` (JSON's escape
 * for a double quote) was then stripped by the attribute parser, producing
 * invalid JSON — so any object whose data contained a double quote silently
 * arrived empty. See the base64 transport in loops.ts / component-processing.ts.
 */
describe('@foreach passing object props to a component', () => {
  let tempDir: string
  let componentsDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'stx-foreach-props-'))
    componentsDir = join(tempDir, 'components')
    await mkdir(componentsDir, { recursive: true })
    await writeFile(
      join(componentsDir, 'row.stx'),
      `<script server>
import { defineProps } from 'stx'
const { item } = defineProps()
</script>
<template><div class="row">[name={{ item && item.name }}|n={{ item && item.n }}|first={{ (item && item.lines && item.lines[0] && item.lines[0].text) || 'NONE' }}]</div></template>
`,
    )
  })

  const render = async (template: string): Promise<string> => {
    return processDirectives(
      template,
      {},
      join(tempDir, 'page.stx'),
      { componentsDir } as any,
      new Set<string>(),
    )
  }

  it('passes object props with special characters intact on every iteration', async () => {
    const template = `<script server>
const items = [
  { name: 'has <b>html</b>', n: 1 },
  { name: 'has "quotes"', n: 2 },
  { name: 'clean', n: 3 },
  { name: 'amp & sand', n: 4 },
]
</script>
@foreach(items as it)
<Row :item="it" />
@endforeach`

    const result = await render(template)

    // The double-quote item used to arrive empty (name=, n=).
    expect(result).toContain('name=has &quot;quotes&quot;|n=2')
    // The other items must keep working.
    expect(result).toContain('name=has &lt;b&gt;html&lt;/b&gt;|n=1')
    expect(result).toContain('name=clean|n=3')
    expect(result).toContain('name=amp &amp; sand|n=4')
    // No row should have lost its props.
    expect(result).not.toContain('[name=|n=')
  })

  it('preserves deeply nested arrays-of-objects across the component boundary', async () => {
    const template = `<script server>
const items = [
  { name: 'a', lines: [{ text: 'line "with" quote' }] },
  { name: 'b', lines: [{ text: 'plain' }] },
]
</script>
@foreach(items as it)
<Row :item="it" />
@endforeach`

    const result = await render(template)

    expect(result).toContain('name=a|n=|first=line &quot;with&quot; quote')
    expect(result).toContain('name=b|n=|first=plain')
    expect(result).not.toContain('first=NONE')
  })
})
