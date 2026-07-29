import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { processDirectives } from '../../src/process'
import { cleanupTestDirs, createPartialFile, PARTIALS_DIR, setupTestDirs } from '../utils'

// Regression: stacksjs/stx#1757
//
// A component's `<script client>` body was interpolated with processExpressions
// — the HTML expression processor — so `{{ }}` output was HTML-ESCAPED into a
// JavaScript context. Any interpolated value containing a quote emitted
// `&quot;`:
//
//   const extraClassName = &quot;foo&quot;;
//
// which is not valid JS: the whole client bundle died with
// `Uncaught SyntaxError: Unexpected token '&'`. That broke every
// @stacksjs/components component seeding a client signal from a server prop
// (Dialog, Drawer, Tabs, Notification, Tooltip, Select, Pagination, …) —
// dropping any of them on a page crashed that page's JS.
//
// Pages never had this bug: process.ts routes non-component scripts through
// interpolateScriptExpressions, which is JS-aware. Components now use the same
// path, so both behave identically:
//   - `{{ expr }}`   → JSON.stringify(value)  (valid JS literal)
//   - `{!! expr !!}` → raw String(value)      (pre-serialized splice)
//   - unresolved     → left intact for the client runtime
//
// Rendered via src `processDirectives` so the assertions exercise src, not a
// possibly-stale dist (see test-realm memory).
describe('stx#1757: {{ }} in a component <script client> emits valid JS', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  const opts = { debug: false, partialsDir: PARTIALS_DIR, componentsDir: PARTIALS_DIR } as any
  const render = (tmpl: string): Promise<string> =>
    processDirectives(tmpl, {}, 'page.stx', opts, new Set())

  /**
   * The component's OWN emitted script body — located by a marker it declares.
   * Scoping to that one block matters: the page also carries the injected
   * signals runtime, whose HTML-entity decoder legitimately contains the
   * literal `&quot;`, which would defeat a page-wide escaping assertion.
   */
  function componentScript(html: string, marker: string): string {
    const blocks = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || []
    const hit = blocks.find(b => b.includes(marker))
    return hit ? hit.replace(/<\/?script[^>]*>/gi, '') : ''
  }

  it('does not HTML-escape quotes into the client script', async () => {
    await createPartialFile(
      'quoted-prop.stx',
      `<script server>\nexport const className = 'foo'\n</script>\n`
      + `<script client>\nconst extraClassName = {{ className }}\n</script>\n<div>w</div>`,
    )
    const out = await render(`<div><quoted-prop /></div>`)
    const js = componentScript(out, 'extraClassName')

    // The exact corruption signature from the issue.
    expect(js).not.toContain('&quot;')
    expect(js).not.toContain('&#39;')
    // A real JS string literal instead.
    expect(js).toMatch(/const extraClassName = ["']foo["']/)
  })

  it('emits parseable JS for values containing quotes, & and angle brackets', async () => {
    await createPartialFile(
      'tricky-prop.stx',
      `<script server>\nexport const title = 'He said "hi" & <bye>'\nexport const count = 42\n</script>\n`
      + `<script client>\nconst t = {{ title }}\nconst c = {{ count }}\n</script>\n<div>w</div>`,
    )
    const out = await render(`<div><tricky-prop /></div>`)
    const js = componentScript(out, 'const t =')

    expect(js).not.toContain('&quot;')
    expect(js).not.toContain('&amp;')
    expect(js).not.toContain('&lt;')
    // The decisive assertion: it actually parses as JavaScript.
    expect(() => {
      // eslint-disable-next-line no-new-func
      void new Function(js)
    }).not.toThrow()
  })

  it('serializes objects as JSON literals', async () => {
    await createPartialFile(
      'obj-prop.stx',
      `<script server>\nexport const cfg = { a: 1, b: 'x' }\n</script>\n`
      + `<script client>\nconst d = {{ cfg }}\n</script>\n<div>w</div>`,
    )
    const out = await render(`<div><obj-prop /></div>`)
    const js = componentScript(out, 'const d =')
    expect(js).toMatch(/const d = \{\s*"?a"?:\s*1/)
    expect(js).not.toContain('&quot;')
  })

  it('supports {!! !!} for a raw, pre-serialized splice', async () => {
    await createPartialFile(
      'raw-prop.stx',
      `<script server>\nexport const className = 'foo'\n</script>\n`
      + `<script client>\nconst e = {!! JSON.stringify(className) !!}\n</script>\n<div>w</div>`,
    )
    const out = await render(`<div><raw-prop /></div>`)
    expect(componentScript(out, 'const e =')).toMatch(/const e = "foo"/)
  })

  it('leaves an unresolved expression intact for the client runtime', async () => {
    // An expression that can't be evaluated server-side (no such server export)
    // must survive verbatim so the client runtime can still bind it, rather than
    // being emptied or escaped.
    await createPartialFile(
      'unresolved-prop.stx',
      `<script client>\nconst x = {{ notAServerExport }}\n</script>\n<div>w</div>`,
    )
    const out = await render(`<div><unresolved-prop /></div>`)
    expect(out).toMatch(/\{\{\s*notAServerExport\s*\}\}/)
  })
})
