/**
 * Web pages ship their own language's messages, not every language
 * (the `messages` option, src/message-catalogs.ts).
 *
 * hq.training's catalogs import both languages (`defineMessages('auth',
 * { en, de })`), so every page's module registry carried the German beside
 * the English: ~230 KB of it on a marketing page read in English. With the
 * option, each message module is a stub in the page's bundles and the page
 * carries one script filling its language (and the fallback) for the areas
 * those bundles import. A page drawn in another language brings its own.
 */
import type { StxOptions } from '../src/types'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { clearComposableCache } from '../src/composable-loader'
import { defaultConfig } from '../src/config'
import { loadPageMessages, messageAreasIn, pageLanguages, pageMessagesEnabled, pageMessagesScript } from '../src/message-catalogs'
import { processDirectives } from '../src/process'
import { clearStoreCache } from '../src/store-loader'
import { createTempDir } from '../src/temp-dir'

const APP = createTempDir('stx-page-messages-')
const cwd = process.cwd()
const messages = { dir: 'lang', languages: ['en', 'de'] }

beforeAll(() => {
  for (const language of ['en', 'de'])
    fs.mkdirSync(path.join(APP, 'lang', language, 'server'), { recursive: true })
  fs.writeFileSync(path.join(APP, 'lang', 'en', 'auth.ts'), `export default { title: 'EN_AUTH_TITLE' }\n`)
  fs.writeFileSync(path.join(APP, 'lang', 'de', 'auth.ts'), `export default { title: 'DE_AUTH_TITLE' }\n`)
  fs.writeFileSync(path.join(APP, 'lang', 'en', 'billing.ts'), `export default { title: 'EN_BILLING_TITLE' }\n`)
  fs.writeFileSync(path.join(APP, 'lang', 'de', 'billing.ts'), `export default { title: 'DE_BILLING_TITLE' }\n`)
  fs.writeFileSync(path.join(APP, 'lang', 'en', 'server', 'errors.ts'), `export default { gone: 'EN_GONE' }\n`)
  fs.writeFileSync(path.join(APP, 'lang', 'de', 'server', 'errors.ts'), `export default { gone: 'DE_GONE' }\n`)
  // The app's catalog for an area, as hq.training writes one.
  fs.writeFileSync(path.join(APP, 'lang', 'auth.ts'), [
    `import en from './en/auth'`,
    `import de from './de/auth'`,
    `const catalogs = { en, de }`,
    `export function t(key: string): string {`,
    `  const language = document.documentElement.lang === 'de' ? 'de' : 'en'`,
    `  return (catalogs[language] as Record<string, string>)[key] ?? (catalogs.en as Record<string, string>)[key] ?? key`,
    `}`,
  ].join('\n'))
  process.chdir(APP)
})

afterAll(() => {
  process.chdir(cwd)
  fs.rmSync(APP, { recursive: true, force: true })
})

afterEach(() => {
  delete process.env.STX_PAGE_MESSAGES
  clearStoreCache()
  clearComposableCache()
})

function page(lang: string | null): string {
  return [
    `<html${lang ? ` lang="${lang}"` : ''}><head><meta charset="utf-8"><title>t</title></head><body>`,
    '<main><p id="title"></p></main>',
    `<script client>import { t } from './lang/auth'\nconst title = state(t('title'))</script>`,
    '</body></html>',
  ].join('\n')
}

async function render(lang: string | null, options: Partial<StxOptions> = {}): Promise<string> {
  return processDirectives(page(lang), {}, path.join(APP, 'page.stx'), { ...defaultConfig, storesDir: path.join(APP, 'stores'), messages, ...options } as StxOptions, new Set())
}

const tagged = (html: string, attribute: string): string => new RegExp(`<script\\b[^>]*\\b${attribute}\\b[^>]*>([\\s\\S]*?)<\\/script>`).exec(html)?.[1] ?? ''

describe('message catalogs, a language at a time', () => {
  it('is on in production with the option, and STX_PAGE_MESSAGES says otherwise', () => {
    expect(pageMessagesEnabled({ messages }, { NODE_ENV: 'production' })).toBe(true)
    expect(pageMessagesEnabled({ messages }, { NODE_ENV: 'development' })).toBe(false)
    expect(pageMessagesEnabled({ messages }, { NODE_ENV: 'development', STX_PAGE_MESSAGES: '1' })).toBe(true)
    expect(pageMessagesEnabled({ messages }, { NODE_ENV: 'production', STX_PAGE_MESSAGES: '0' })).toBe(false)
    expect(pageMessagesEnabled({}, { NODE_ENV: 'production' })).toBe(false)
  })

  it('ships the page\'s language and the fallback, or every language when the page names none', () => {
    const known = { languages: ['en', 'de'], fallback: 'en' }
    expect(pageLanguages('<html lang="en">', known)).toEqual(['en'])
    expect(pageLanguages('<html lang="de-DE" class="x">', known)).toEqual(['de', 'en'])
    expect(pageLanguages('<html>', known)).toEqual(['en', 'de'])
    expect(pageLanguages('<html lang="fr">', known)).toEqual(['en', 'de'])
  })

  it('fills each area once, into the object its importers already hold', async () => {
    const collected = await loadPageMessages(APP, messages)
    expect(messageAreasIn('x"stx-messages:de:auth"y', 'z "stx-messages:en:server/errors"')).toEqual(new Set(['auth', 'server/errors']))
    const code = pageMessagesScript(collected, ['de', 'en'], ['auth', 'server/errors'])!
    expect(code).toContain('DE_AUTH_TITLE')
    expect(code).toContain('EN_GONE')
    expect(code).not.toContain('BILLING')
    const g = globalThis as any
    const previous = { kept: g.__stxMessages, filled: g.__stxMessagesFilled }
    try {
      const held = {}
      g.__stxMessages = { 'stx-messages:de:auth': held }
      delete g.__stxMessagesFilled
      // eslint-disable-next-line no-eval
      ;(0, eval)(code)
      expect(held).toEqual({ title: 'DE_AUTH_TITLE' })
      ;(held as Record<string, string>).title = 'changed'
      // eslint-disable-next-line no-eval
      ;(0, eval)(code)
      expect(held).toEqual({ title: 'changed' })
    }
    finally {
      g.__stxMessages = previous.kept
      g.__stxMessagesFilled = previous.filled
    }
  })

  it('leaves other languages out of an English page, and the catalog still answers', async () => {
    process.env.STX_PAGE_MESSAGES = '1'
    const html = await render('en')
    const registry = tagged(html, 'data-stx-modules')
    const filled = tagged(html, 'data-stx-messages')
    expect(registry).not.toContain('EN_AUTH_TITLE')
    expect(registry).not.toContain('DE_AUTH_TITLE')
    expect(filled).toContain('EN_AUTH_TITLE')
    expect(html).not.toContain('DE_AUTH_TITLE')
    // Its own area only, and ahead of the registry that reads it.
    expect(filled).not.toContain('BILLING')
    expect(html.indexOf('data-stx-messages')).toBeLessThan(html.indexOf('data-stx-modules'))
    expect(html).toMatch(/<script data-stx-scoped data-stx-run="always" data-stx-messages>/)

    const g = globalThis as any
    const previous = { kept: g.__stxMessages, filled: g.__stxMessagesFilled, modules: g.__stxModules, bundles: g.__stxModuleBundles, lang: document.documentElement.lang }
    try {
      delete g.__stxMessages
      delete g.__stxMessagesFilled
      delete g.__stxModules
      delete g.__stxModuleBundles
      document.documentElement.lang = 'en'
      // eslint-disable-next-line no-eval
      ;(0, eval)(filled)
      // eslint-disable-next-line no-eval
      ;(0, eval)(registry)
      const auth = Object.entries(g.__stxModules as Record<string, any>).find(([id]) => id.endsWith('lang/auth.ts'))![1]
      expect(auth.t('title')).toBe('EN_AUTH_TITLE')
      // A German page's messages, loaded later (the router does it before the swap).
      // eslint-disable-next-line no-eval
      ;(0, eval)(tagged(await render('de'), 'data-stx-messages'))
      document.documentElement.lang = 'de'
      expect(auth.t('title')).toBe('DE_AUTH_TITLE')
    }
    finally {
      g.__stxMessages = previous.kept
      g.__stxMessagesFilled = previous.filled
      g.__stxModules = previous.modules
      g.__stxModuleBundles = previous.bundles
      document.documentElement.lang = previous.lang
    }
  })

  it('ships both languages to a German page, sharing the English page\'s registry', async () => {
    process.env.STX_PAGE_MESSAGES = '1'
    const german = await render('de')
    expect(tagged(german, 'data-stx-messages')).toContain('DE_AUTH_TITLE')
    expect(tagged(german, 'data-stx-messages')).toContain('EN_AUTH_TITLE')
    expect(tagged(german, 'data-stx-modules')).toBe(tagged(await render('en'), 'data-stx-modules'))
  })

  it('ships every language, inline as before, when turned off', async () => {
    process.env.STX_PAGE_MESSAGES = '0'
    const html = await render('en')
    expect(html).not.toContain('data-stx-messages')
    expect(tagged(html, 'data-stx-modules')).toContain('DE_AUTH_TITLE')
  })
})
