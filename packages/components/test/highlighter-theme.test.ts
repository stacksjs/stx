/**
 * `highlight()` renders the theme it was asked for (stacksjs/stx#2015).
 *
 * The history, because the shape of this file follows from it. The theme was
 * once resolved, returned in the result, and never passed to the highlighter,
 * so every block was light while the returned `theme` said otherwise. Then
 * `auto` could not work at all: the highlighter wrote each colour into a
 * `style` attribute, where no media query can reach it, so following a
 * dark-mode switch meant rendering twice and reading the colours back out.
 *
 * And for most of that time none of it could be tested here. The highlighter's
 * root entry imports `bunfig`, which this runner could not resolve, so
 * `highlight()` took its plain-text floor and the palette assertions were
 * skipped. It goes through the highlighter's browser entry now, which loads
 * anywhere, so nothing below is conditional.
 *
 * What it emits changed with that: a class on each token and no colour, with
 * the palettes as custom properties. Light and dark are the same markup.
 */
import { describe, expect, it } from 'bun:test'
import { highlight, highlightToHtml } from '../src/utils/highlighter'
import { SYNTAX_DARK, SYNTAX_LIGHT } from '../src/utils/syntax-theme'

const CODE = 'const x: number = 1 // note'

describe('highlight() colours with classes, not inline styles', () => {
  it('loads, which it could not in this runner before', async () => {
    const result = await highlight(CODE, { language: 'typescript' })

    expect(result.css.length).toBeGreaterThan(0)
    expect(result.html).toContain('<span class="tok-keyword">const</span>')
  })

  it('writes no colour into the markup, for any theme', async () => {
    for (const theme of ['light', 'dark', 'auto'] as const) {
      const result = await highlight(CODE, { language: 'typescript', theme })

      // The whole reason a media query could not work.
      expect(result.html, theme).not.toContain('style=')
      expect(result.html, theme).toContain('class="tok-comment"')
    }
  })

  it('gives back exactly the code, escaped', async () => {
    const source = 'if (a < b && c > "d") {\n  return `<${tag}>`\n}'
    const result = await highlight(source, { language: 'typescript' })
    const text = result.html
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')

    expect(text).toBe(source)
    expect(result.html).toContain('&lt;')
    expect(result.html).toContain('&amp;&amp;')
    expect(result.html).not.toMatch(/<(?!\/?(?:pre|code|span)\b)/)
  })

  it('one span per run of a colour, one line per line', async () => {
    const html = (await highlightToHtml('a b c\nd', { language: 'typescript' }))!

    expect(html).toBe('<pre class="syntax"><code><span class="line">a b c</span>\n<span class="line">d</span></code></pre>')
  })
})

describe('highlight() reports the theme it was asked for', () => {
  it('names the palette for an explicit theme', async () => {
    expect((await highlight(CODE, { language: 'typescript', theme: 'dark' })).theme).toBe('github-dark')
    expect((await highlight(CODE, { language: 'typescript', theme: 'light' })).theme).toBe('github-light')
  })

  it('reports auto when both palettes shipped', async () => {
    expect((await highlight(CODE, { language: 'typescript', theme: 'auto' })).theme).toBe('auto')
  })

  it('names one palette on the plain-text floor, where neither shipped', async () => {
    // Reporting `auto` over no CSS at all would be the same untruth this issue
    // is about: the field says what was emitted, not what was asked for.
    const auto = await highlight(CODE, { language: 'no-such-language', theme: 'auto' })
    const dark = await highlight(CODE, { language: 'no-such-language', theme: 'dark' })

    expect(auto.css).toBe('')
    expect(auto.theme).toBe('github-light')
    expect(dark.theme).toBe('github-dark')
    // The code is the content. It is still there.
    expect(auto.html).toBe('<pre class="syntax"><code>const x: number = 1 // note</code></pre>')
  })
})

describe('an explicit theme is pinned on the element', () => {
  it('marks the block, so the palette holds whatever the page is doing', async () => {
    const dark = await highlight(CODE, { language: 'typescript', theme: 'dark' })
    const light = await highlight(CODE, { language: 'typescript', theme: 'light' })

    expect(dark.html).toStartWith('<pre class="syntax" data-syntax-theme="dark">')
    expect(light.html).toStartWith('<pre class="syntax" data-syntax-theme="light">')
  })

  it('ships that palette and not the other', async () => {
    const dark = await highlight(CODE, { language: 'typescript', theme: 'dark' })
    const light = await highlight(CODE, { language: 'typescript', theme: 'light' })

    expect(dark.css).toContain(`--stx-syntax-background: ${SYNTAX_DARK.background};`)
    expect(dark.css).not.toContain(SYNTAX_LIGHT.keyword!)
    expect(light.css).toContain(`--stx-syntax-background: ${SYNTAX_LIGHT.background};`)
    expect(light.css).not.toContain(SYNTAX_DARK.keyword!)
    expect(dark.css).not.toBe(light.css)
    expect(dark.css).not.toContain('prefers-color-scheme')
  })
})

describe('auto ships both palettes and lets CSS choose', () => {
  const auto = () => highlight(CODE, { language: 'typescript', theme: 'auto' })

  it('leaves the block unpinned', async () => {
    expect((await auto()).html).toStartWith('<pre class="syntax">')
  })

  it('carries both switches, matching how the library does dark mode', async () => {
    const { css } = await auto()

    // A viewer following their OS…
    expect(css).toContain('@media (prefers-color-scheme: dark)')
    // …guarded, or a page pinned to light on a dark OS would still get dark code…
    expect(css).toContain(':root:not(.light)')
    // …and an app with a manual toggle.
    expect(css).toMatch(/:where\(\.dark\) \{/)
  })

  it('puts the dark panel in the dark block, not just the tokens', async () => {
    const { css } = await auto()
    const darkBlock = /:where\(\.dark\) \{([^}]*)\}/.exec(css)![1]!

    // Dark tokens on a white panel is the same bug in reverse, and the half a
    // reader notices first.
    expect(darkBlock).toContain(`--stx-syntax-background: ${SYNTAX_DARK.background};`)
    expect(darkBlock).toContain(`--stx-syntax-keyword: ${SYNTAX_DARK.keyword};`)
    expect(css).toMatch(/\.syntax \{[^}]*background-color: var\(--stx-syntax-background\)/)
  })

  it('has a light and a dark value for every token it colours', async () => {
    const { css, html } = await auto()
    const used = new Set([...html.matchAll(/class="tok-([\w-]+)"/g)].map(match => match[1]!))

    expect(used.size).toBeGreaterThan(2)
    for (const name of used) {
      expect(css, name).toContain(`.tok-${name} { color: var(--stx-syntax-${name}); }`)
      expect(css.split(`--stx-syntax-${name}: ${SYNTAX_LIGHT[name]};`).length - 1, `${name} light`).toBeGreaterThanOrEqual(1)
      expect(css.split(`--stx-syntax-${name}: ${SYNTAX_DARK[name]};`).length - 1, `${name} dark`).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('line numbers', () => {
  it('are a marker for CSS, never text that a copy would pick up', async () => {
    const numbered = await highlight('a\nb', { language: 'typescript', lineNumbers: true })

    expect(numbered.html).toContain('data-line-numbers')
    expect(numbered.html.replace(/<[^>]+>/g, '')).toBe('a\nb')
    expect(numbered.css).toContain('counter-increment: stx-syntax-line')
  })
})

describe('in a browser bundle', () => {
  /*
   * `highlightToHtml` is what a page passes to `<CodeBlock :highlighter>`, so
   * this module has to survive being bundled for a browser. It could not
   * before: the only highlighter it knew was the package root, which the
   * `browser` field in package.json maps to an empty module.
   */
  it('reaches the highlighter through its browser entry, and nothing a browser lacks', async () => {
    const reached: string[] = []
    const result = await Bun.build({
      entrypoints: [new URL('../src/utils/highlighter.ts', import.meta.url).pathname],
      target: 'browser',
      format: 'esm',
      plugins: [{
        name: 'record-imports',
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            reached.push(args.path)
            return undefined
          })
        },
      }],
    })

    expect(result.success).toBe(true)
    expect(reached).toContain('ts-syntax-highlighter/browser')
    expect(reached.filter(specifier => specifier === 'bunfig' || specifier.startsWith('node:'))).toEqual([])

    const output = (await Promise.all(result.outputs.map(artifact => artifact.text()))).join('\n')
    expect(output).not.toMatch(/["']node:[a-z_/]+["']/)
    expect(output).not.toContain('import.meta')
  })
})
