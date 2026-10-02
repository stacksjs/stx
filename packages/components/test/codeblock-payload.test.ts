/**
 * The code reaches the browser only when a copy button needs it
 * (stacksjs/stx#2014).
 *
 * `<script client>` carried an unconditional `const code = {{ code }}`, while
 * `copyable` gated only the button in the template — so `:copyable="false"`
 * still emitted the full snippet as page JavaScript, and there was no way to
 * render a highlighted block without shipping its text.
 *
 * The app that reported it has five blocks that are install commands carrying
 * a per-resource credential. It keeps those bindings behind a `__` prefix
 * because stx's `extractBridgeData` skips `__` and `$` names, and has a test
 * enforcing that no server binding reaches page HTML through the bridge —
 * written after raw rows carrying a token leaked into dashboard HTML once.
 * `:code="__agentInstall.install"` routed straight around that.
 */
import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { processDirectives } from '../../stx/src/process'

/*
 * Rendered from the component's OWN directory, not a copy in a temp dir.
 *
 * CodeBlock's server script does `import { highlight } from
 * '../utils/highlighter'`, so a copy anywhere else cannot resolve it - the
 * script throws, every export is undefined, and the component renders with no
 * props at all. My first version of this file copied it into the shared
 * partials dir and spent four failures on that rather than on the component.
 */
const COMPONENTS = path.join(import.meta.dir, '..', 'src', 'components')
// No double quotes: the fixture is interpolated into a double-quoted
// attribute, and my first version embedded a real curl command with its own
// quotes, which broke the attribute and left the prop empty - four failures
// spent on the fixture rather than the component.
const SECRET = 'curl -H Authorization:Bearer-sk-live-TOPSECRET https://x/ping'

async function render(attrs: string): Promise<string> {
  return processDirectives(
    `<div><CodeBlock code="${SECRET}" ${attrs} /></div>`,
    {},
    path.join(COMPONENTS, 'page.stx'),
    { debug: false, componentsDir: COMPONENTS } as never,
    new Set(),
  )
}

/**
 * Just the component's own client script, located by the scope id stx stamps
 * on it.
 *
 * Not by searching for `copyToClipboard`: the framework composables block
 * carries `useClipboard`, which defines a function of that name, so matching on
 * it returned the WRONG script and every assertion about the payload read
 * false. The scope owner is the component's and nothing else's.
 */
function clientScript(html: string): string {
  const blocks = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || []
  const own = blocks.find(b => /data-stx-owner="stx_code_block/.test(b))
  if (!own)
    throw new Error('CodeBlock emitted no scoped client script')
  return own.replace(/<\/?script[^>]*>/gi, '')
}

describe('#2014 — CodeBlock does not ship code it cannot copy', () => {
  /*
   * Scoped to the client SCRIPT, not the page. The snippet is still visible as
   * rendered text - that is what a code block is - and the report says so
   * explicitly: "this is not a new disclosure to a third party". What it
   * defeats is an app's invariant that no server binding reaches page
   * JavaScript, so the script is the thing to assert on.
   */
  it('omits the snippet from page JavaScript when copyable is false', async () => {
    const html = await render('copyable="false"')

    expect(html).not.toContain('aria-label="Copy code"')
    expect(clientScript(html)).not.toContain('sk-live-TOPSECRET')
    // …while the block itself still renders the code for a reader.
    expect(html).toContain('sk-live-TOPSECRET')
  })

  it('still ships it when the copy button is there to use it', async () => {
    const html = await render('')

    expect(html).toContain('aria-label="Copy code"')
    expect(clientScript(html)).toContain('sk-live-TOPSECRET')
  })

  /*
   * A ternary inside a `{{ }}` in a client script is the part worth pinning:
   * `interpolateScriptExpressions` only treats an identifier or property path
   * as a server value, so an expression it cannot resolve emits `undefined`
   * (#1989). If that ever applied here, `copyable: false` would ship
   * `const code = undefined` and every copy would silently produce nothing.
   */
  it('resolves the guard rather than emitting undefined', async () => {
    for (const attrs of ['copyable="false"', '']) {
      const js = clientScript(await render(attrs))

      // Narrowly: the DECLARATION. The generated scope boilerplate legitimately
      // contains `typeof code !== 'undefined'`, so a bare search for the word
      // fails on correct output.
      expect(js, attrs).not.toContain('const code = undefined')
      expect(js, attrs).toMatch(/const code = "/)
    }
  })

  /*
   * `copyable="false"` is a STRING, and `$props.copyable !== false` is true for
   * it - so the button rendered however the prop was written. Reading it with
   * `$bool` is the documented rule (stacksjs/stx#2006); `!== false` is a third
   * spelling of the same bug that the library-wide sweep does not recognise,
   * and this is the second half of why #2014 looked like a template problem.
   */
  it('reads copyable as a boolean, whatever the attribute says', async () => {
    for (const falsy of ['copyable="false"', 'copyable="0"', 'copyable="no"', 'copyable="off"']) {
      const html = await render(falsy)

      expect(html, falsy).not.toContain('aria-label="Copy code"')
    }
    for (const truthy of ['', 'copyable', 'copyable="true"']) {
      const html = await render(truthy)

      expect(html, truthy).toContain('aria-label="Copy code"')
    }
  })

  /*
   * The copy button was `opacity-0 group-hover:opacity-100` with no focus
   * variant, so a keyboard user who tabbed to it saw nothing and on a touch
   * device it never appeared at all.
   */
  it('keeps the copy button visible without a pointer', async () => {
    const html = await render('')

    expect(html).toContain('focus-visible:opacity-100')
    // Not hover-only: there is no `@media (hover: none)` variant to hang the
    // touch case on, so it is always present and brightens on hover/focus.
    expect(html).not.toContain('opacity-0 group-hover:opacity-100')
    expect(html).toContain('opacity-60')
  })
})
