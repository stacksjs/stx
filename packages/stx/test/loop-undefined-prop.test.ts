/**
 * A component prop inside a server loop that evaluates to `undefined`.
 *
 * The loop pre-evaluates every `:prop="expr"` against its iteration context and
 * rewrites it to `__stx_prop="<base64 json>"`. `JSON.stringify` returns the
 * VALUE `undefined` — not a string — for undefined, so `Buffer.from` threw and
 * the catch kept the original `:prop="expr"` binding.
 *
 * That raw binding then travelled to the browser as a client-reactive prop
 * referencing the loop variable, which exists only on the server. stx's own
 * hydration invariant caught it there and logged "expression(s) never
 * evaluated" on every page load, once per absent prop, forever.
 *
 * The tell was which props failed: exactly the ones the iterated object did not
 * define. Everything it did define serialized fine and never reached the client.
 */
import { describe, expect, it } from 'bun:test'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { serve } from '../src/serve'

/**
 * A page with a component rendered inside `@foreach`, where the first item
 * omits two of the props the invocation binds.
 */
function project(): { dir: string, views: string } {
  const dir = mkdtempSync(join(tmpdir(), 'stx-loop-prop-'))
  const views = join(dir, 'views')
  const components = join(dir, 'kit')
  mkdirSync(views, { recursive: true })
  mkdirSync(components, { recursive: true })

  writeFileSync(join(dir, 'stx.config.ts'), `export default { componentsDir: ${JSON.stringify(components)} }\n`)
  writeFileSync(join(components, 'Row.stx'), [
    '<script server>',
    "export const id = $props.id || ''",
    "export const label = $props.label || '(none)'",
    'export const flag = $props.flag ?? true',
    '</script>',
    '<div data-row-id="{{ id }}" data-label="{{ label }}" data-flag="{{ flag }}"></div>',
  ].join('\n'))
  writeFileSync(join(views, 'index.stx'), [
    '<script server>',
    "export const items = [{ id: 'bare' }, { id: 'full', label: 'Full', flag: false }]",
    '</script>',
    '<body>',
    '@foreach(items as item)',
    '  <Row :id="item.id" :label="item.label" :flag="item.flag" />',
    '@endforeach',
    '</body>',
  ].join('\n'))

  return { dir, views }
}

async function render(): Promise<string> {
  const { dir, views } = project()
  const server = await serve({ port: 0, root: views, configDir: dir, watch: false })
  try {
    return await (await fetch(`${server.url}/index`)).text()
  }
  finally {
    server.stop()
  }
}

describe('a loop prop that evaluates to undefined', () => {
  it('does not leave the raw binding in the output', async () => {
    const html = await render()
    // `:label="item.label"` surviving means the loop failed to pre-evaluate it
    // and the browser will be asked to resolve `item`, which it does not have.
    expect(html).not.toContain(':label="item.label"')
    expect(html).not.toContain(':flag="item.flag"')
    expect(html.match(/:[a-z-]+="item\.[a-z]+"/g) ?? []).toEqual([])
  })

  it('does not register the loop variable for client hydration', async () => {
    const html = await render()
    expect(html).not.toContain('data-stx-parent-bindings')
  })

  it('lets the component fall back to its own default', async () => {
    // An absent prop and a prop that evaluated to undefined are the same
    // thing to `$props.x ?? fallback`, which is what the component expects.
    const html = await render()
    expect(html).toContain('data-row-id="bare"')
    expect(html).toContain('data-label="(none)"')
  })

  it('still passes the props that DO have values', async () => {
    const html = await render()
    expect(html).toContain('data-row-id="full"')
    expect(html).toContain('data-label="Full"')
  })

  it('keeps a binding it could not evaluate at all', async () => {
    // Two different things produce undefined here. `item.label` on an item with
    // no label EVALUATED — the answer is "no value". `unknownVar.property` did
    // not: the safe evaluator returns undefined for a name it has no binding
    // for rather than throwing, and that binding must survive for a later pass.
    const dir = mkdtempSync(join(tmpdir(), 'stx-loop-unknown-'))
    const views = join(dir, 'views')
    mkdirSync(views, { recursive: true })
    writeFileSync(join(dir, 'stx.config.ts'), 'export default {}\n')
    writeFileSync(join(views, 'index.stx'), [
      '<script server>',
      "export const items = ['a']",
      '</script>',
      '<body>',
      '@foreach(items as item)',
      '  <div data-probe :data="unknownVar.property"></div>',
      '@endforeach',
      '</body>',
    ].join('\n'))

    const server = await serve({ port: 0, root: views, configDir: dir, watch: false })
    try {
      const html = await (await fetch(`${server.url}/index`)).text()
      expect(html).toContain(':data="unknownVar.property"')
    }
    finally {
      server.stop()
    }
  })

  it('passes a falsy value rather than treating it as absent', async () => {
    // `false` is a value. Only `undefined` means "not provided", and the two
    // must not collapse: the second item sets flag to false explicitly.
    const html = await render()
    const flags = [...html.matchAll(/data-flag="([^"]*)"/g)].map(m => m[1])
    expect(flags).toEqual(['true', 'false'])
  })
})
