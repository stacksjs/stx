/**
 * A complete script tag inside a server-block STRING does not eat the page
 * (stacksjs/stx#1904).
 *
 * `renderTemplate` removed server blocks by depth-counting `<script`
 * occurrences. Script elements do not nest — and a browser's parser does not
 * treat them as nesting either; once in script-data state only an end tag
 * leaves it, which is why the emitters in this codebase escape `<` as `<`
 * when writing a value into a script body.
 *
 * So `const alpha = "VAL <script>x"` counted as a nested element, demanded a
 * second closing tag, and the removal range ran past the server block and
 * swallowed the page's entire `<script client>`. No setup function, no
 * server-to-client bridge, response still 200 — a page that looks right and is
 * completely inert. Same class as most of the August sweep.
 */

import { describe, expect, it } from 'bun:test'
import { renderTemplate } from '../src/render'

async function render(source: string): Promise<string> {
  const file = `${import.meta.dir}/.tmp-sis-${crypto.randomUUID()}.stx`
  await Bun.write(file, source)
  try {
    return await renderTemplate(file, { context: {} } as any)
  }
  finally {
    await Bun.file(file).delete().catch(() => {})
  }
}

const PAGE = (value: string) => `<script server>
const alpha = ${value}
defineClientPayload({ alpha })
</script>
<script client>
const n = state(0)
const use = alpha
</script>
<div :text="n()">0</div>`

describe('a script tag in a server string', () => {
  it('leaves the client block intact', async () => {
    const html = await render(PAGE('"VAL <script>x"'))

    expect(html).toMatch(/const n = state\(0\)/)
    expect(html).toMatch(/__stx_setup_\w+/)
  })

  it('is not special compared with any other tag in a string', async () => {
    // The control from the report: only a COMPLETE opening tag triggered it.
    const withDiv = await render(PAGE('"VAL <div>x"'))
    const withScript = await render(PAGE('"VAL <script>x"'))

    expect(/const n = state\(0\)/.test(withDiv)).toBe(true)
    expect(/const n = state\(0\)/.test(withScript)).toBe(true)
  })

  it('still removes the server block itself', async () => {
    // The removal has to keep working, or the fix has just disabled it and the
    // server source ships to the browser.
    const html = await render(PAGE('"VAL <script>x"'))

    expect(html).not.toContain('defineClientPayload({ alpha })')
  })

  it('handles a closing tag in a string too', async () => {
    const html = await render(`<script server>
const shut = "a <\\/script> b"
</script>
<script client>
const n = state(0)
</script>`)

    expect(html).toMatch(/const n = state\(0\)/)
  })
})
