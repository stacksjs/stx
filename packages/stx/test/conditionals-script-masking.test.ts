/**
 * Directives are not read inside a `<script>`.
 *
 * A template directive is just text, and so is the body of a script tag. A
 * conditional block containing JavaScript that mentions `@else` therefore sees
 * a directive nobody wrote: the scanner matches the real `@if` against a token
 * inside a string literal, and everything between them is swallowed. The page
 * still answers 200. It is simply missing the middle, with no error anywhere.
 *
 * This is not only about hand-written scripts. stx injects its own signals
 * runtime, and the runtime contains `'@else-if'` and `'@else'` - it has to,
 * those are attributes it supports. So a component carrying `x-data`, used
 * inside another component, inside an `@if` branch, truncated the page it was
 * on. Three things at once, which is why it survived: a component with `x-data`
 * used directly in a view has its runtime injected before `</body>`, after the
 * conditionals have already run.
 *
 * Found in an app: a repository page rendered its header and clone box and then
 * stopped, with no closing tags.
 */

import { describe, expect, it } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { processConditionals } from '../src/conditionals'
import { processDirectives } from '../src/process'

/** Render a page and its components the way the pipeline does. */
async function render(files: Record<string, string>, page: string): Promise<string> {
  const root = mkdtempSync(join(tmpdir(), 'stx-masking-'))

  try {
    const components = join(root, 'components')
    mkdirSync(components, { recursive: true })

    for (const [name, content] of Object.entries(files))
      writeFileSync(join(components, `${name}.stx`), content)

    const pagePath = join(root, 'page.stx')
    writeFileSync(pagePath, page)

    return await processDirectives(page, {}, pagePath, { componentsDir: components, root } as any, new Set())
  }
  finally {
    rmSync(root, { recursive: true, force: true })
  }
}

describe('a script inside a conditional', () => {
  it('does not end the block early with an @else in a string', () => {
    const output = processConditionals(
      `@if (true)KEPT<script>var a = "@else";</script>STILL_KEPT@endif`,
      {},
      'test.stx',
    )

    expect(output).toContain('KEPT')
    // The half that used to disappear: everything from the fake `@else` to the
    // real `@endif`.
    expect(output).toContain('STILL_KEPT')
    expect(output).toContain('var a = "@else";')
  })

  it('does not end the block early with an @endif in a string', () => {
    const output = processConditionals(
      `@if (true)A<script>var s = '@endif';</script>B@endif TAIL`,
      {},
      'test.stx',
    )

    expect(output).toContain('A')
    expect(output).toContain('B')
    expect(output).toContain('TAIL')
    expect(output).toContain(`var s = '@endif';`)
  })

  it('still drops the script when its branch is not taken', () => {
    // Masking must not smuggle content past the condition: a hidden branch's
    // script is as gone as the rest of it.
    const output = processConditionals(
      `@if (false)<script>var secret = 1;</script>@endif`,
      {},
      'test.stx',
    )

    expect(output).not.toContain('secret')
  })

  it('keeps the right script when a branch is chosen', () => {
    const output = processConditionals(
      `@if (flag)<script>var yes = 1;</script>@else<script>var no = 1;</script>@endif`,
      { flag: true },
      'test.stx',
    )

    expect(output).toContain('var yes = 1;')
    expect(output).not.toContain('var no = 1;')
  })

  it('leaves a script outside any conditional exactly as it was', () => {
    const template = `<script>if (a) { b() } else { c() }</script>@if (true)X@endif`
    const output = processConditionals(template, {}, 'test.stx')

    expect(output).toContain('if (a) { b() } else { c() }')
    expect(output).toContain('X')
  })

  it('handles several scripts, in order', () => {
    const output = processConditionals(
      `@if (true)<script>var one = "@endif";</script>MID<script>var two = "@else";</script>@endif`,
      {},
      'test.stx',
    )

    expect(output).toContain('var one = "@endif";')
    expect(output).toContain('MID')
    expect(output).toContain('var two = "@else";')
    expect(output.indexOf('var one')).toBeLessThan(output.indexOf('var two'))
  })

  it('reads attributes on the script tag as script, not template', () => {
    // The opening tag can carry quotes and braces of its own, and none of it is
    // template either.
    const output = processConditionals(
      `@if (true)<script type="module" data-x="@if (nope)">var a = 1;</script>DONE@endif`,
      {},
      'test.stx',
    )

    expect(output).toContain('data-x="@if (nope)"')
    expect(output).toContain('DONE')
  })
})

describe('a component carrying x-data, nested inside a conditional', () => {
  const INNER = `<div x-data="{ open: false }"><span>INNER</span></div>`
  const MIDDLE = `<div><Inner /><span>MIDDLE_TAIL</span></div>`

  it('does not swallow the rest of the branch', async () => {
    const html = await render(
      { Inner: INNER, Middle: MIDDLE },
      `<div>
        <span>BEFORE</span>
        @if (false)
          <span>NEVER</span>
        @else
          <Middle />
          <span>AFTER_COMPONENT</span>
        @endif
        <span>OUTSIDE</span>
      </div>`,
    )

    expect(html).toContain('INNER')
    // These three are what went missing: the rest of the middle component, and
    // the rest of the branch it was used in.
    expect(html).toContain('MIDDLE_TAIL')
    expect(html).toContain('AFTER_COMPONENT')
    expect(html).toContain('OUTSIDE')
    expect(html).not.toContain('NEVER')
  })

  it('leaves the page in one piece rather than spliced into a script', async () => {
    const html = await render(
      { Inner: INNER, Middle: MIDDLE },
      `<div>
        @if (true)
          <Middle />
        @endif
        <p>LAST</p>
      </div>`,
    )

    // The symptom that named the bug: the tail of the document turning up
    // inside a JavaScript string literal in the injected runtime.
    expect(/hasAttribute\("\s*<[a-z]/i.test(html)).toBe(false)
    expect(html.indexOf('LAST')).toBeGreaterThan(html.indexOf('INNER'))
  })
})
