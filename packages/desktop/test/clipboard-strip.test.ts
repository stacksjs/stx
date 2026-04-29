/**
 * Tests for the writeHTML web fallback's HTML→text reducer.
 * The reducer is internal to clipboard.ts; we exercise it through
 * `writeHTML` and inspect what gets written via the navigator.clipboard
 * stub. (`stripHtml` itself isn't exported.)
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { clipboard } from '../src/clipboard'

describe('clipboard.writeHTML stripHtml fallback', () => {
  let writes: Array<{ html: string, text: string }>

  beforeEach(() => {
    delete (window as any).craft
    writes = []

    // very-happy-dom doesn't ship Blob/ClipboardItem; stub minimal
    // versions that capture the bytes the production code feeds in.
    ;(window as any).Blob = class FakeBlob {
      constructor(parts: any[], _opts: any) {
        ;(this as any).__parts = parts
      }
      async text() { return (this as any).__parts.join('') }
    }
    ;(window as any).ClipboardItem = class { constructor(public types: any) {} }
    ;(globalThis as any).Blob = (window as any).Blob
    ;(globalThis as any).ClipboardItem = (window as any).ClipboardItem
    ;(navigator as any).clipboard = {
      async write(items: any[]) {
        for (const it of items) {
          const html = await it.types['text/html'].text()
          const text = await it.types['text/plain'].text()
          writes.push({ html, text })
        }
      },
    }
  })

  afterEach(() => {
    delete (navigator as any).clipboard
    delete (window as any).Blob
    delete (window as any).ClipboardItem
    delete (globalThis as any).Blob
    delete (globalThis as any).ClipboardItem
  })

  it('strips simple HTML tags from the plaintext alt', async () => {
    await clipboard.writeHTML('<b>Hello</b> <i>World</i>')
    expect(writes[0]?.text).toBe('Hello World')
  })

  it('drops <script> contents entirely', async () => {
    await clipboard.writeHTML('<p>Hi</p><script>alert(1)</script><p>Bye</p>')
    expect(writes[0]?.text).not.toContain('alert(1)')
    expect(writes[0]?.text).toContain('Hi')
    expect(writes[0]?.text).toContain('Bye')
  })

  it('drops <style> contents entirely', async () => {
    await clipboard.writeHTML('<style>p{color:red}</style><p>Hi</p>')
    expect(writes[0]?.text).not.toContain('color:red')
    expect(writes[0]?.text).toContain('Hi')
  })

  it('replaces block-level tags with newlines', async () => {
    await clipboard.writeHTML('<p>One</p><p>Two</p>')
    expect(writes[0]?.text).toContain('One')
    expect(writes[0]?.text).toContain('Two')
    expect(writes[0]?.text).toContain('\n')
  })

  it('decodes common HTML entities', async () => {
    await clipboard.writeHTML('<p>5 &lt; 10 &amp;&amp; 3 &gt; 1</p>')
    expect(writes[0]?.text).toContain('5 < 10 && 3 > 1')
  })
})
