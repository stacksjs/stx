/**
 * JSON embedded in a `<script>` tag cannot close it (stacksjs/stx#1849).
 *
 * `JSON.stringify` is not enough for script content: a `</script>` inside any
 * string value ends the tag early and the remainder lands in the document as
 * markup, and U+2028/U+2029 are line terminators in JavaScript though legal
 * unescaped in JSON.
 *
 * Five private copies of this escape already existed — `spa-shell.ts`,
 * `appearance-bootstrap.ts`, `color-mode-boot.ts`, `misc-directives.ts` and
 * `bun-plugin/src/serve.ts` — and a sixth injection site had none at all:
 * `runtime-injection.ts`, where the `ownedRoutes` table was added in #1864.
 * Those regexes come from FILENAMES, so a route file with `>` in its name was
 * enough.
 */
import { describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { clearOwnedRoutesCache } from '../src/owned-routes'
import { injectRouterScript } from '../src/runtime-injection'
import { escapeJsonForScript, toScriptJson } from '../src/script-json'

const LINE_SEP = '\u2028'
const PARA_SEP = '\u2029'

describe('escaping', () => {
  it('neutralises a closing script tag', () => {
    const out = toScriptJson({ evil: '</script><img src=x onerror=alert(1)>' })

    expect(out.toLowerCase()).not.toContain('</script')
    expect(out).toContain('\\u003c')
  })

  it('escapes every spelling of the closing tag, not just the exact string', () => {
    // `</SCRIPT `, `</script foo` and friends all terminate the element.
    const out = toScriptJson({ a: '</SCRIPT ', b: '</script foo' })

    expect(out).not.toContain('<')
    expect(out).not.toContain('>')
  })

  it('escapes the JavaScript line terminators', () => {
    const out = toScriptJson({ ls: `a${LINE_SEP}b`, ps: `c${PARA_SEP}d` })

    expect(out).not.toContain(LINE_SEP)
    expect(out).not.toContain(PARA_SEP)
    expect(out).toContain('\\u2028')
    expect(out).toContain('\\u2029')
  })

  it('leaves ordinary text alone', () => {
    // Over-escaping would corrupt the payload just as surely.
    const out = toScriptJson({ msg: 'has spaces, commas & ampersands' })

    expect(out).toContain('has spaces, commas & ampersands')
  })

  it('still parses as JSON once the escapes are read back', () => {
    // The escapes are JS-level; a JSON parser sees the original characters.
    const value = { a: '</script>', b: `x${LINE_SEP}y` }
    const embedded = toScriptJson(value)

    // eslint-disable-next-line no-new-func
    expect(new Function(`return ${embedded}`)()).toEqual(value)
  })

  it('escapeJsonForScript works on an already-serialised string', () => {
    expect(escapeJsonForScript('{"a":"<b>"}')).toBe('{"a":"\\u003cb\\u003e"}')
  })
})

describe('the router config injection site', () => {
  let dir = ''
  const originalCwd = process.cwd()

  it('cannot be closed early by a router config value', async () => {
    // The reachable vector. `router` config strings are copied into the script
    // verbatim, so a `container` selector holding `</script>` ends the element
    // and everything after it becomes markup.
    const html = await injectRouterScript('<html><body><main>x</main></body></html>', {
      router: { container: '</script><script>pwned()</script>' },
    } as any)

    const start = html.indexOf('window.__stxRouterConfig=')
    expect(start).toBeGreaterThan(-1)

    // The browser ends the element at the FIRST `</script>`. Whatever precedes
    // it is the whole script body, so it must still be the complete, parseable
    // assignment rather than a truncated object literal.
    const body = html.slice(start, html.indexOf('</script>', start))
    const json = body.replace('window.__stxRouterConfig=', '').replace(/;\s*$/, '')

    // eslint-disable-next-line no-new-func
    const parsed = new Function(`return ${json}`)()
    expect(parsed.container).toBe('</script><script>pwned()</script>')
    // And no second script element was smuggled in.
    expect(html).not.toContain('<script>pwned()')
  })

  it('does not rely on regex serialisation to stay safe', async () => {
    // A route path CAN contain `</script>` via a directory boundary — a folder
    // named `a<` holding `script>.stx` gives the pattern `/a</script>`. Today
    // the regex compiler escapes `/` as `\/`, so it emits `<\/script>` and is
    // harmless by accident. Pinned so the accident is visible if it changes.
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-script-json-'))
    fs.mkdirSync(path.join(dir, 'pages', 'a<'), { recursive: true })
    fs.writeFileSync(path.join(dir, 'pages', 'index.stx'), '<main>Home</main>\n')
    fs.writeFileSync(path.join(dir, 'pages', 'a<', 'script>.stx'), '<main>Odd</main>\n')
    clearOwnedRoutesCache()
    process.chdir(dir)

    try {
      const html = await injectRouterScript('<html><body><main>x</main></body></html>', { pagesDir: 'pages' } as any)

      const start = html.indexOf('window.__stxRouterConfig=')
      const body = html.slice(start, html.indexOf('</script>', start))
      const json = body.replace('window.__stxRouterConfig=', '').replace(/;\s*$/, '')

      // eslint-disable-next-line no-new-func
      const parsed = new Function(`return ${json}`)()
      expect(parsed.ownedRoutes.length).toBeGreaterThanOrEqual(2)
    }
    finally {
      process.chdir(originalCwd)
      clearOwnedRoutesCache()
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
