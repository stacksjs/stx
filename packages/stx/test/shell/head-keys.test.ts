/**
 * A misspelled head key is read when the intent is plain, and said out loud
 * when it is not.
 *
 * An app's stx config carried `app.head.links: [...]` for five months. The key
 * is `link`, so stx ignored the block and no page got its favicon or its font
 * stylesheets, with nothing in any log. The plural of a list key is now read
 * as the singular with a warning to rename it, and any other unknown key gets
 * a warning naming the key it most likely meant.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { APP_HEAD_KEYS, nearestHeadKey, normalizeHeadKeys, resetHeadKeyWarnings, USE_HEAD_KEYS } from '../../src/head-keys'
import { processDirectives } from '../../src/process'

let warnings: string[] = []
const originalWarn = console.warn

beforeEach(() => {
  warnings = []
  resetHeadKeyWarnings()
  console.warn = (...args: unknown[]) => { warnings.push(args.map(String).join(' ')) }
})

afterEach(() => {
  console.warn = originalWarn
})

const appHead = (head: Record<string, unknown>) => normalizeHeadKeys(head, { known: APP_HEAD_KEYS, source: 'app.head' })

describe('normalizeHeadKeys', () => {
  it('reads app.head.links as link, and says to rename it', () => {
    const head = appHead({ links: [{ rel: 'icon', href: '/favicon.svg' }] })
    expect(head.link).toEqual([{ rel: 'icon', href: '/favicon.svg' }])
    expect('links' in head).toBe(false)
    expect(warnings).toEqual(['[stx] app.head.links is not a head key; reading it as app.head.link. Rename it to `link`.'])
  })

  it('keeps singular entries first when both spellings are present', () => {
    const head = appHead({ link: [{ href: '/a.css' }], links: [{ href: '/b.css' }], metas: [{ name: 'x', content: '1' }], scripts: [{ src: '/s.js' }] })
    expect(head.link).toEqual([{ href: '/a.css' }, { href: '/b.css' }])
    expect(head.meta).toEqual([{ name: 'x', content: '1' }])
    expect(head.script).toEqual([{ src: '/s.js' }])
  })

  it('suggests the nearest key for a near miss, and leaves it unread', () => {
    const head = appHead({ bodyclass: 'dark', metta: [] })
    expect(head).toEqual({ bodyclass: 'dark', metta: [] })
    expect(warnings).toContain('[stx] app.head.bodyclass is not a head key and is ignored. Did you mean `bodyClass`?')
    expect(warnings).toContain('[stx] app.head.metta is not a head key and is ignored. Did you mean `meta`?')
  })

  it('points a stylesheet list at link, since app.head has no style key', () => {
    appHead({ styles: [{ content: 'body{}' }] })
    expect(warnings[0]).toContain('app.head.styles is not a head key and is ignored')
    expect(warnings[0]).toContain('rel: \'stylesheet\'')
  })

  it('lists the known keys when nothing is close', () => {
    appHead({ favicon: '/favicon.ico' })
    expect(warnings[0]).toBe(`[stx] app.head.favicon is not a head key and is ignored. Known keys: ${APP_HEAD_KEYS.join(', ')}.`)
  })

  it('reads useHead({ styles }) as style, which useHead does have', () => {
    const head = normalizeHeadKeys({ styles: [{ content: 'a{}' }] }, { known: USE_HEAD_KEYS, source: 'useHead()' })
    expect(head.style).toEqual([{ content: 'a{}' }])
    expect(warnings[0]).toContain('useHead().styles')
  })

  it('returns a config with only known keys as is, and warns once per key', () => {
    const clean = { title: 'T', link: [] }
    expect(appHead(clean)).toBe(clean)
    expect(warnings).toEqual([])

    appHead({ links: [] })
    appHead({ links: [] })
    expect(warnings).toHaveLength(1)
  })

  it('does not offer lang for link or the other way round', () => {
    expect(nearestHeadKey('lnk', APP_HEAD_KEYS)).toBe('link')
    expect(nearestHeadKey('lang', ['link'])).toBeUndefined()
  })
})

describe('through the render pipeline', () => {
  it('renders app.head.links into the page head', async () => {
    const out = await processDirectives('<main>hi</main>', {}, '/app/index.stx', {
      ...defaultConfig,
      partialsDir: '/tmp',
      componentsDir: '/tmp',
      autoShell: true,
      app: { head: { links: [{ rel: 'icon', href: '/favicon.svg' }, { rel: 'stylesheet', href: '/fonts.css' }] } },
    } as never, new Set<string>())

    const head = out.slice(0, out.indexOf('</head>'))
    expect(head).toContain('href="/favicon.svg"')
    expect(head).toContain('href="/fonts.css"')
    expect(warnings.some(w => w.includes('app.head.links'))).toBe(true)
  })
})
