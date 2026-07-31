/**
 * Regression: script classification treated an HTML comment as live markup.
 *
 * A comment whose prose merely names a script tag — e.g.
 * `<!-- the <script server> block owner-scopes the switcher -->` — was matched
 * by the classifier's global `/<script\b[^>]*>([\s\S]*?)<\/script>/g` as a REAL
 * opening tag. The non-greedy body then ran on to the next `</script>` in the
 * file, so the reported `fullTag` spanned from inside the comment to the end of
 * an unrelated script.
 *
 * Every caller deletes `fullTag` from the template (app-shell's `cleanTemplate`,
 * serve-app's `templateContent`, the bun plugin's build path), so that one bad
 * span erased the comment's `-->` terminator, the real script, and all the
 * markup in between. In the app that surfaced this, the result was a 154 KB
 * runaway comment node in `<body>`, a single surviving `<script>` element in the
 * whole document, and a blank page with the router source dumped as text.
 */
import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { processShell } from '../../src/app-shell'
import { classifyAllScripts } from '../../src/script-classifier'

const tmpDir = path.join(import.meta.dir, 'tmp-classifier-comments')

beforeAll(() => {
  fs.mkdirSync(tmpDir, { recursive: true })
})

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('classifyAllScripts (comment regions are inert)', () => {
  it('does not read a script tag named in a comment as a real script', () => {
    const tpl = [
      '<div>',
      '  <!-- the <script server> block owner-scopes the switcher -->',
      '  <nav>Navigation</nav>',
      '  <script client>console.log(\'switcher\')</script>',
      '</div>',
    ].join('\n')

    const { server, client, signals } = classifyAllScripts(tpl)

    expect(server).toHaveLength(0)
    expect(signals).toHaveLength(0)
    expect(client.map(s => s.fullTag)).toEqual(['<script client>console.log(\'switcher\')</script>'])
  })

  it('leaves the comment and the markup around it intact when callers delete fullTag', () => {
    const tpl = [
      '<!-- see the <script server> block above -->',
      '<nav>Navigation</nav>',
      '<script>const title = "Home"</script>',
    ].join('\n')

    const { server, client, signals } = classifyAllScripts(tpl)
    let cleaned = tpl
    for (const s of [...server, ...client, ...signals]) cleaned = cleaned.replace(s.fullTag, '')

    // the comment still terminates, and nothing between it and the real script
    // was swallowed — only the script itself is gone
    expect(cleaned).toContain('<!-- see the <script server> block above -->')
    expect(cleaned).toContain('<nav>Navigation</nav>')
    expect(cleaned).not.toContain('const title')
  })

  it('still classifies a closing-comment-less template rather than dropping its scripts', () => {
    // `<!--` with no terminator is malformed markup; we resume scanning past the
    // marker so a genuine trailing server script is still stripped from output
    const { server } = classifyAllScripts('<!-- oops\n<script>const a = 1</script>')
    expect(server.map(s => s.content)).toEqual(['const a = 1'])
  })

  it('still finds scripts written inside an SFC <template> block', () => {
    const { server } = classifyAllScripts('<template><div><script>const a = 1</script></div></template>')
    expect(server.map(s => s.content)).toEqual(['const a = 1'])
  })
})

describe('processShell (comment mentioning a script tag)', () => {
  it('keeps the shell\'s real script and the markup the bad span used to eat', async () => {
    const shellPath = path.join(tmpDir, 'shell-comment.stx')
    fs.writeFileSync(shellPath, `<div class="app">
  <!-- the <script server> block owner-scopes the switcher -->
  <nav>Navigation</nav>
  <script client>console.log('switcher')</script>
  <main><slot /></main>
</div>`)

    const result = await processShell(shellPath, {})
    expect(result).not.toBeNull()
    // the client script is collected for the shell instead of being consumed as
    // the tail of a phantom server script
    expect(result!.shellScripts).toContain('<script client>console.log(\'switcher\')</script>')
    expect(result!.beforeSlot).toContain('<nav>Navigation</nav>')
  })

  it('does not swallow the <slot /> that follows the comment', async () => {
    // the phantom span ran comment → `</script>`, so a slot sitting between the
    // two was deleted before the slot placeholder pass and processShell bailed
    const shellPath = path.join(tmpDir, 'shell-comment-slot.stx')
    fs.writeFileSync(shellPath, `<div class="app">
  <!-- the <script server> block owner-scopes the switcher -->
  <main><slot /></main>
  <script client>console.log('switcher')</script>
</div>`)

    const result = await processShell(shellPath, {})
    expect(result).not.toBeNull()
    expect(result!.beforeSlot).toContain('<main>')
    expect(result!.afterSlot).toContain('</main>')
  })
})
