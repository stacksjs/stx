import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'

/**
 * `$props` is a callable (so `$props({ count: 0 })` can supply defaults), which
 * means any property it does not carry falls through to Function.prototype.
 *
 * An UNPASSED prop named after one of a function's own properties therefore
 * resolved to the function's internals instead of undefined: `$props.name`
 * returned the string "$props" — the arrow function's inferred name — and
 * `$props.length` returned its arity.
 *
 * So the near-universal component idiom
 *
 *   export const name = $props.name || ''
 *
 * produced "$props" rather than "", and every `@if(name)` branch fired when it
 * should have been skipped. <SidebarFooter> rendered a phantom profile row
 * labelled "$props" whenever it was used for actions only. Nothing errored, and
 * `name` is one of the most common prop names there is.
 *
 * Props that ARE passed were never affected — they are installed with
 * defineProperty precisely because assigning over readonly `name`/`length`
 * throws. Only the fallback was wrong.
 */
describe('$props does not leak Function internals for unpassed props', () => {
  let dir: string

  beforeAll(async () => {
    dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'stx-props-shadow-'))
    await Bun.write(
      path.join(dir, 'Probe.stx'),
      `<script server>\n`
      + `export const name = $props.name || ''\n`
      + `export const length = $props.length || ''\n`
      + `export const detail = $props.detail || ''\n`
      + `</script>\n`
      + `<div>name=[{{ name }}] length=[{{ length }}] detail=[{{ detail }}]</div>`,
    )
  })

  afterAll(async () => {
    await fs.promises.rm(dir, { recursive: true, force: true })
  })

  const render = (tmpl: string): Promise<string> =>
    processDirectives(tmpl, {}, path.join(dir, 'page.stx'), { componentsDir: dir, debug: false } as any, new Set())

  it('reads an unpassed `name` prop as empty, not the function name', async () => {
    const out = await render(`<div><Probe /></div>`)
    expect(out).toContain('name=[]')
    // The exact regression: the arrow function's own name leaking through.
    expect(out).not.toContain('name=[$props]')
  })

  it('reads an unpassed `length` prop as empty, not the function arity', async () => {
    const out = await render(`<div><Probe /></div>`)
    expect(out).toContain('length=[]')
    expect(out).not.toMatch(/length=\[\d+\]/)
  })

  it('still resolves those props normally when they ARE passed', async () => {
    const out = await render(`<div><Probe name="Chris" length="42" /></div>`)
    expect(out).toContain('name=[Chris]')
    expect(out).toContain('length=[42]')
  })

  it('leaves ordinary props untouched', async () => {
    expect(await render(`<div><Probe /></div>`)).toContain('detail=[]')
    expect(await render(`<div><Probe detail="hi" /></div>`)).toContain('detail=[hi]')
  })
})
