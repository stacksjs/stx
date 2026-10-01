/**
 * A component's style block resolves its expressions.
 *
 * The style element is lifted out of the component's source BEFORE expressions
 * run, and interpolation then works on a template that no longer contains it.
 * So a stylesheet built from server data shipped as the literal marker, which
 * the browser discards, and the page received an effectively empty `<style>` -
 * no error, nothing logged (stacksjs/stx#1990).
 *
 * <CodeBlock> is the concrete loss: ts-syntax-highlighter hands back 2,777
 * bytes of token colours that could not reach the page, so highlighted code
 * rendered correctly marked up and entirely monochrome. The CSS was exported
 * for consumers to include by hand instead.
 *
 * CSS rules, not HTML rules. Escaping `>` or `&` would break selectors and
 * `content:` strings, and a style element's contents are not parsed as HTML,
 * so values go in raw - with one exception, asserted below.
 */
import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { processDirectives } from '../../src/process'

async function renderComponent(source: string, markup = '<Probe />'): Promise<string> {
  const dir = `${import.meta.dir}/.tmp-style-interp-${crypto.randomUUID()}`
  await Bun.write(path.join(dir, 'components', 'Probe.stx'), source)

  try {
    return await processDirectives(
      markup,
      {},
      path.join(dir, 'page.stx'),
      { componentsDir: path.join(dir, 'components'), root: dir, buildMode: 'serve', cache: false } as any,
      new Set<string>(),
    )
  }
  finally {
    await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
  }
}

/** The style element's contents, which is what this is all about. */
function styleBody(html: string): string {
  return html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/)?.[1] ?? ''
}

describe('a component style block interpolates (#1990)', () => {
  it('resolves a raw marker, which is how a whole stylesheet arrives', async () => {
    const html = await renderComponent(`<script server>
export const dynamicCss = '.probe { color: rebeccapurple }'
</script>
<div><style>{!! dynamicCss !!}</style><p class="probe">hi</p></div>
`)

    expect(styleBody(html)).toContain('color: rebeccapurple')
    expect(styleBody(html)).not.toContain('{!!')
  })

  it('resolves a mustache, for a single value in a rule', async () => {
    const html = await renderComponent(`<script server>
export const accent = 'teal'
</script>
<div><style>.m { color: {{ accent }} }</style><p>hi</p></div>
`)

    expect(styleBody(html)).toContain('color: teal')
    expect(styleBody(html)).not.toContain('{{')
  })

  /*
   * The reason this uses CSS rules rather than the HTML expression pipeline: a
   * child selector and an attribute selector both contain characters HTML
   * escaping would mangle into something a browser ignores.
   */
  it('leaves selector syntax alone', async () => {
    const html = await renderComponent(`<script server>
export const accent = 'teal'
</script>
<div><style>
.a > .b { color: {{ accent }} }
.c[data-x="y"]::after { content: "a & b" }
</style><p>hi</p></div>
`)

    expect(styleBody(html)).toContain('.a > .b')
    expect(styleBody(html)).toContain('"a & b"')
    expect(styleBody(html)).not.toContain('&gt;')
    expect(styleBody(html)).not.toContain('&amp;')
  })

  it('emits nothing for a value the server does not have', async () => {
    const html = await renderComponent(`<div><style>.m { color: {{ missing }} }</style><p>hi</p></div>`)

    expect(styleBody(html)).toContain('.m { color:  }')
    expect(styleBody(html)).not.toContain('{{')
  })

  /*
   * The one sequence that matters. A closing tag inside the value would end the
   * element early and let the rest be parsed as markup, so it is refused
   * rather than escaped: no real stylesheet contains one, and quietly mangling
   * CSS is worse than dropping a value that cannot be right.
   */
  it('refuses a value that would close the style element', async () => {
    const html = await renderComponent(`<script server>
export const hostile = '.a{} </style><img src=x onerror=alert(1)>'
</script>
<div><style>{!! hostile !!}</style><p>hi</p></div>
`)

    expect(html).not.toContain('onerror')
    expect(styleBody(html)).not.toContain('</style')
  })

  it('leaves a style block with nothing to interpolate byte-identical', async () => {
    const css = '.plain { color: red }'
    const html = await renderComponent(`<div><style>${css}</style><p>hi</p></div>`)

    expect(styleBody(html)).toBe(css)
  })
})
