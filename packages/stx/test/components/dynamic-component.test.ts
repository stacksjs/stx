/**
 * `<component :is>` reaches its own handler (stacksjs/stx#1817).
 *
 * The static component pass resolves any unknown lowercase tag to a component
 * file, and `component` is not an HTML element — so it claimed
 * `<component :is>`, looked for a file literally named `component.stx`, failed,
 * and emitted an error string **including absolute server filesystem paths**
 * into the rendered page. The slot content was destroyed and the dynamic
 * handler never saw the tag.
 *
 * That took out the entire headless-primitive family in `@stacksjs/components`
 * — 26 of 91 primitives — because they are all built on `<component :is>`.
 *
 * Two changes, and both matter:
 *
 *  - `component` is in the static scan's skip-set, so a stray `<component>` can
 *    never leak filesystem paths into a response.
 *  - the dynamic pass runs BEFORE the static one, so whatever it resolves to is
 *    still ahead of the static pass and its own nested components, builtins and
 *    links are processed normally.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

let dir: string

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-dyn-'))
  fs.mkdirSync(path.join(dir, 'components'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'components', 'Card.stx'), '<article class="card"><slot /></article>')
  fs.writeFileSync(path.join(dir, 'components', 'Inner.stx'), '<b class="inner">deep</b>')
  fs.writeFileSync(path.join(dir, 'components', 'Wrap.stx'), '<section><Inner /><slot /></section>')
})

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

/** Render, returning the body with injected CSS stripped. */
async function render(template: string, context: Record<string, unknown> = {}) {
  const out = await processDirectives(template, context, path.join(dir, 'page.stx'), {
    ...defaultConfig,
    componentsDir: path.join(dir, 'components'),
    partialsDir: dir,
    layoutsDir: dir,
    autoShell: false,
  } as never, new Set<string>())
  return {
    raw: out,
    body: out.replace(/<style[\s\S]*?<\/style>/g, '').replace(/\s+/g, ' ').trim(),
  }
}

describe('<component :is>', () => {
  it('resolves to the named component', async () => {
    const { body } = await render('<component :is="which" class="x">hello</component>', { which: 'Card' })
    expect(body).toContain('<article class="card">')
  })

  it('keeps the slot content', async () => {
    // The static pass destroyed it, replacing the whole element with an error.
    const { body } = await render('<component :is="which">hello</component>', { which: 'Card' })
    expect(body).toContain('hello')
  })

  it('never leaks server filesystem paths into the page', async () => {
    // The reported symptom: absolute paths from the developer's machine served
    // to every visitor.
    const { raw } = await render('<component :is="which">hello</component>', { which: 'Card' })
    expect(raw).not.toContain('Searched paths')
    expect(raw).not.toContain('Error loading component')
    expect(raw).not.toContain('component.stx')
  })

  it('processes components nested inside the resolved one', async () => {
    // This is what the pass ORDER buys: the dynamic pass runs first, so its
    // output is still ahead of the static pass.
    const { body } = await render('<component :is="which">body</component>', { which: 'Wrap' })
    expect(body).toContain('<b class="inner">deep</b>')
    expect(body).toContain('body')
  })

  it('does not leak paths for the v-bind:is spelling either', async () => {
    // The dynamic pass accepts v-bind:is, but `v-bind:` also trips the
    // signals-syntax detector, so this template takes a different route
    // entirely. That interaction is pre-existing and out of scope here; what
    // matters for this issue is that it still cannot emit server paths.
    const { raw } = await render('<component v-bind:is="which">bound</component>', { which: 'Card' })
    expect(raw).not.toContain('Searched paths')
    expect(raw).not.toContain('Error loading component')
  })

  it('leaves a static is= alone — only :is and v-bind:is are bindings', async () => {
    // Vue accepts a literal `is="Card"`; stx does not, and the important part
    // is that the unsupported form degrades to inert markup rather than to an
    // error string carrying server paths.
    const { raw, body } = await render('<component is="Card">literal</component>')
    expect(raw).not.toContain('Searched paths')
    expect(body).toContain('literal')
  })

  it('leaves a component tag with no :is alone rather than erroring', async () => {
    // Nothing to resolve, so nothing to guess at — and above all, no error
    // string carrying server paths.
    const { raw, body } = await render('<component>orphan</component>')
    expect(raw).not.toContain('Searched paths')
    expect(body).toContain('orphan')
  })

  it('still resolves ordinary components on the same page', async () => {
    const { body } = await render('<Card>static</Card><component :is="which">dynamic</component>', { which: 'Wrap' })
    expect(body).toContain('<article class="card">static</article>')
    expect(body).toContain('<section>')
  })
})
