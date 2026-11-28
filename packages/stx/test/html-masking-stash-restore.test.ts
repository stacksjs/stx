import { describe, expect, it } from 'bun:test'
import { clearStashCache, maskAtElementPosition, matchScriptElement, stashScriptElements, withHtmlMaskMemos } from '../src/html-masking'

/** Larger than the shared memo accepts. */
function padded(body: string): string {
  return `<html><body>${'<p>filler filler filler</p>\n'.repeat(3000)}${body}</body></html>`
}

describe('stashScriptElements().restore', () => {
  it('is the inverse of the stash when nothing edited the masked document', () => {
    const html = '<div><script>if (a < b) {}</script><p>x</p><script>c > d</script></div>'
    const stashed = stashScriptElements(html)

    expect(stashed.scripts).toHaveLength(2)
    expect(stashed.output).not.toContain('<script>')
    expect(stashed.restore(stashed.output)).toBe(html)
  })

  it('still substitutes scripts back into a document that WAS edited', () => {
    const html = '<div><script>keep()</script><span>old</span></div>'
    const stashed = stashScriptElements(html)
    const edited = stashed.output.replace('<span>old</span>', '<span>new</span>')

    expect(stashed.restore(edited)).toBe('<div><script>keep()</script><span>new</span></div>')
  })

  it('restores sentinels inside a fragment of the masked document', () => {
    // component-renderer restores into one tag's slot content, not the whole page.
    const html = '<div><script>inner()</script></div>'
    const stashed = stashScriptElements(html)
    const fragment = stashed.output.slice('<div>'.length, -'</div>'.length)

    expect(stashed.restore(fragment)).toBe('<script>inner()</script>')
  })

  it('returns a script-free document untouched', () => {
    const html = '<div><p>no scripts here</p></div>'
    const stashed = stashScriptElements(html)

    expect(stashed.scripts).toHaveLength(0)
    expect(stashed.output).toBe(html)
    expect(stashed.restore(stashed.output)).toBe(html)
  })

  it('is the inverse on the cached path, including on a cache hit', async () => withHtmlMaskMemos(async () => {
    clearStashCache()
    const html = padded('<script>big()</script><script server>data()</script>')
    expect(html.length).toBeGreaterThan(65536)

    const first = stashScriptElements(html)
    expect(first.scripts).toHaveLength(2)
    expect(first.restore(first.output)).toBe(html)

    // Second call hits the memo; its restore must still be the inverse, and an
    // edit made after the hit must still land.
    const second = stashScriptElements(html)
    expect(second.restore(second.output)).toBe(html)
    expect(second.restore(second.output.replace('<html>', '<html lang="en">')))
      .toBe(html.replace('<html>', '<html lang="en">'))
  }))

  it('does not let one caller mutate the scripts another will restore', async () => withHtmlMaskMemos(async () => {
    clearStashCache()
    const html = padded('<script>shared()</script>')

    const first = stashScriptElements(html)
    first.scripts.length = 0

    const second = stashScriptElements(html)
    expect(second.scripts).toHaveLength(1)
    expect(second.restore(second.output)).toBe(html)
  }))
})

describe('request-local HTML memo', () => {
  it('shares large input within a render and drops it between concurrent renders', async () => {
    const html = padded('<script>large()</script>')
    let scans = 0
    const mask = () => maskAtElementPosition(html, matchScriptElement, () => {
      scans++
      return '<!--script-->'
    }, 'large-input-test')

    const render = () => withHtmlMaskMemos(async () => {
      const result = mask()
      await withHtmlMaskMemos(async () => {
        await Promise.resolve()
        expect(mask()).toEqual(result)
      })
      expect(result.tokens).toEqual(['<script>large()</script>'])
    })

    await Promise.all([render(), render()])
    expect(scans).toBe(2)
    await render()
    expect(scans).toBe(3)
  })

  it('still shares small input between renders', async () => {
    const html = `${'<p>short</p>'.repeat(200)}<script>small()</script>`
    let scans = 0
    const render = () => withHtmlMaskMemos(async () => maskAtElementPosition(html, matchScriptElement, () => {
      scans++
      return '<!--script-->'
    }, 'small-input-test'))
    expect(await render()).toEqual(await render())
    expect(scans).toBe(1)
  })
})
