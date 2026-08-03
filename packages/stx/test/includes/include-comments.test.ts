import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { processDirectives } from '../../src/process'

/**
 * stx comments inside an included partial.
 *
 * `processDirectives` strips `{{-- --}}` once, near the top of its
 * pipeline, and expands `@include` some seven hundred lines later. A
 * comment written inside a partial therefore entered the stream after the
 * only pass that would have removed it.
 *
 * It did not just survive, it corrupted the output: `{{--` opens what the
 * expression processor reads as a mustache, so the body was evaluated and
 * swallowed while the trailing `--}}` rendered into the page as literal
 * text.
 *
 * These run through `processDirectives` rather than `processIncludes`
 * alone, because the include layer does no expression processing and the
 * corruption is invisible from there.
 */

const TEST_DIR = path.join(import.meta.dir, 'temp-include-comments')

function render(template: string): Promise<string> {
  const options = { partialsDir: TEST_DIR } as StxOptions
  return processDirectives(template, {}, path.join(TEST_DIR, 'page.stx'), options, new Set())
}

function partial(name: string, content: string): void {
  fs.writeFileSync(path.join(TEST_DIR, `${name}.stx`), content)
}

describe('stx comments in included partials', () => {
  beforeAll(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true })
  })

  afterAll(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('strips a comment written in the partial', async () => {
    partial('commented', `{{-- why this markup looks the way it does --}}\n<p>visible</p>`)

    const result = await render(`<div>@include('commented')</div>`)

    expect(result).toContain('visible')
    expect(result).not.toContain('why this markup looks the way it does')
    expect(result).not.toContain('{{--')
    expect(result).not.toContain('--}}')
  })

  it('strips a multi-line comment', async () => {
    partial('multiline', `{{--\n  first line\n  second line\n--}}\n<p>kept</p>`)

    const result = await render(`<div>@include('multiline')</div>`)

    expect(result).toContain('kept')
    expect(result).not.toContain('first line')
    expect(result).not.toContain('second line')
    expect(result).not.toContain('--}}')
  })

  it('leaves no trailing delimiter behind', async () => {
    // The regression that started this: the body was eaten as a mustache
    // and `--}}` shipped to the browser as text.
    //
    // The whitespace the comment sat on is left alone, matching how the
    // top-level strip in `processDirectives` behaves. Consuming it here
    // only would make a comment's effect depend on whether it happened to
    // be in a partial.
    partial('trailing', `{{-- a note --}}\n<p>body</p>`)

    const result = await render(`<div>@include('trailing')</div>`)

    expect(result.replace(/\s+/g, '')).toBe('<div><p>body</p></div>')
  })

  it('keeps a comment inert even when it contains an expression', async () => {
    // The inner `}}` used to close the accidental expression early, so the
    // remainder of the comment leaked as well.
    partial('with-expression', `{{-- note {{ 2 + 2 }} more --}}\n<p>rendered</p>`)

    const result = await render(`<div>@include('with-expression')</div>`)

    expect(result).toContain('rendered')
    expect(result).not.toContain('note')
    expect(result).not.toContain('more')
    expect(result).not.toContain('4')
  })

  it('keeps a comment inert when it contains a directive', async () => {
    // A commented-out `@include` that still resolves is worse than having
    // no comment support at all.
    partial('with-directive', `{{-- @include('does-not-exist') --}}\n<p>rendered</p>`)

    const result = await render(`<div>@include('with-directive')</div>`)

    expect(result).toContain('rendered')
    expect(result).not.toContain('does-not-exist')
    expect(result).not.toContain('Error loading include')
  })

  it('strips the header stx init scaffolds into every component', async () => {
    partial('card', `{{-- Component: Card --}}\n{{-- Props: title, variant --}}\n<div class="card">card</div>`)

    const result = await render(`<div>@include('card')</div>`)

    expect(result).toContain('card')
    expect(result).not.toContain('Component: Card')
    expect(result).not.toContain('Props:')
  })

  it('strips comments in a nested partial too', async () => {
    partial('inner', `{{-- inner note --}}\n<span>inner</span>`)
    partial('outer', `{{-- outer note --}}\n<div>@include('inner')</div>`)

    const result = await render(`@include('outer')`)

    expect(result).toContain('inner')
    expect(result).not.toContain('inner note')
    expect(result).not.toContain('outer note')
  })

  it('keeps HTML comments, which are output the author asked for', async () => {
    partial('html-comment', `<!-- shipped on purpose -->\n<p>body</p>`)

    const result = await render(`<div>@include('html-comment')</div>`)

    expect(result).toContain('shipped on purpose')
    expect(result).toContain('body')
  })
})
