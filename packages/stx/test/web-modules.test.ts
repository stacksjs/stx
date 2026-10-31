/**
 * A web page's bundles load an app's stand-in for a module only a native
 * compile runs (the `webModules` option, src/web-modules.ts).
 *
 * hq.training's auth store asks `nativeAuthFor(craft)` whether it runs on the
 * phone. On the website that answers null before anything else runs, but
 * the module imports the phone's account helpers, they import the player and
 * Apple Health modules for a key apiece, and those import their message
 * catalogs, which register themselves as they load. Bun drops the code no
 * page calls and keeps every registration, so every page reading the auth
 * store shipped ~110 KB of the phone's messages. Nothing in the built code
 * tells that registration apart from one a page needs; the app does.
 */
import type { StxOptions } from '../src/types'
import { afterAll, afterEach, beforeAll, describe, expect, it, spyOn } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { clearComposableCache } from '../src/composable-loader'
import { defaultConfig } from '../src/config'
import { processDirectives } from '../src/process'
import { clearStoreCache } from '../src/store-loader'
import { createTempDir } from '../src/temp-dir'
import { loadWebModules } from '../src/web-modules'

const APP = createTempDir('stx-web-modules-')
const storesDir = path.join(APP, 'stores')
const cwd = process.cwd()
const messages = { dir: 'lang', languages: ['en', 'de'] }
const webModules = { 'functions/native-auth.ts': 'web/native-auth.ts' }

function write(file: string, lines: string[]): void {
  fs.mkdirSync(path.dirname(path.join(APP, file)), { recursive: true })
  fs.writeFileSync(path.join(APP, file), `${lines.join('\n')}\n`)
}

beforeAll(() => {
  for (const [language, word] of [['en', 'EN'], ['de', 'DE']]) {
    write(`lang/${language}/auth.ts`, [`export default { title: '${word}_AUTH_TITLE' }`])
    write(`lang/${language}/player.ts`, [`export default { pause: '${word}_PLAYER_PAUSE' }`])
  }
  // Catalogs as hq.training writes them: registered by area as they load.
  for (const area of ['auth', 'player']) {
    write(`lang/${area}.ts`, [
      `import en from './en/${area}'`,
      `import de from './de/${area}'`,
      `const kept = (globalThis as any).__catalogs || ((globalThis as any).__catalogs = {})`,
      `kept['${area}'] = { en, de }`,
      `export function t(key: string): string { return kept['${area}'].en[key] ?? key }`,
    ])
  }
  // The phone's half: a key it needs from a module that loads the player's messages.
  write('functions/player-session.ts', [
    `import { t } from '../lang/player'`,
    `export const PLAYER_KEYS = { session: (who: string) => 'player-session:' + who }`,
    `export function pauseLabel(): string { return t('pause') }`,
  ])
  write('functions/native-auth.ts', [
    `import { PLAYER_KEYS } from './player-session'`,
    `export function nativeAuthFor(craft: any): { forget: (who: string) => string } | null {`,
    `  if (craft?.platform !== 'ios') return null`,
    `  return { forget: who => 'PHONE_ONLY_FORGET ' + PLAYER_KEYS.session(who) }`,
    `}`,
  ])
  write('web/native-auth.ts', [
    `/** The website is never a phone. */`,
    `export interface NativeAuth { forget: (who: string) => string }`,
    `export function nativeAuthFor(_craft: unknown): NativeAuth | null { return (globalThis as any).WEB_STAND_IN_SENTINEL ?? null }`,
  ])
  write('stores/auth.ts', [
    `import { defineStore, state } from 'stx'`,
    `import { nativeAuthFor } from '../functions/native-auth'`,
    `import { t } from '../lang/auth'`,
    `export const useAuth = defineStore('auth', () => {`,
    `  const native = nativeAuthFor((globalThis as any).craft)`,
    `  const title = state(t('title'))`,
    `  return { native, title }`,
    `})`,
  ])
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

const page = [
  '<html lang="en"><head><meta charset="utf-8"><title>t</title></head><body>',
  '<main><p id="title"></p></main>',
  `<script client>const auth = useStore('auth')\nconst title = auth.title</script>`,
  '</body></html>',
].join('\n')

async function render(options: Partial<StxOptions> = {}, context: Record<string, unknown> = {}): Promise<string> {
  return processDirectives(page, context, path.join(APP, 'page.stx'), { ...defaultConfig, storesDir, messages, ...options } as StxOptions, new Set())
}

/** Every script the page carries, inline or bundled. */
function scripts(html: string): string {
  return [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n')
}
const tagged = (html: string, attribute: string): string => new RegExp(`<script\\b[^>]*\\b${attribute}\\b[^>]*>([\\s\\S]*?)<\\/script>`).exec(html)?.[1] ?? ''

describe('webModules', () => {
  it('ships the phone\'s module and its messages without the option', async () => {
    process.env.STX_PAGE_MESSAGES = '1'
    const html = await render()
    expect(scripts(html)).toContain('PHONE_ONLY_FORGET')
    expect(tagged(html, 'data-stx-messages')).toContain('EN_PLAYER_PAUSE')
  })

  it('bundles the stand-in instead, and the messages only it imported stay home', async () => {
    process.env.STX_PAGE_MESSAGES = '1'
    const html = await render({ webModules } as Partial<StxOptions>)
    const all = scripts(html)
    expect(all).not.toContain('PHONE_ONLY_FORGET')
    expect(all).not.toContain('player-session:')
    expect(all).toContain('WEB_STAND_IN_SENTINEL')
    const filled = tagged(html, 'data-stx-messages')
    expect(filled).not.toContain('PLAYER_PAUSE')
    // The page's own catalog still ships.
    expect(filled).toContain('EN_AUTH_TITLE')

    // No stub of the player's catalog is left to fill either.
    expect(all).not.toContain('stx-messages:en:player')
    expect(all).toContain('stx-messages:en:auth')
  })

  it('applies with every language shipped too (messages off, or in development)', async () => {
    process.env.STX_PAGE_MESSAGES = '0'
    const all = scripts(await render({ webModules } as Partial<StxOptions>))
    expect(all).not.toContain('PHONE_ONLY_FORGET')
    expect(all).not.toContain('DE_PLAYER_PAUSE')
    expect(all).toContain('DE_AUTH_TITLE')
  })

  it('leaves a native screen\'s build alone', async () => {
    process.env.STX_PAGE_MESSAGES = '1'
    const html = await render({ webModules } as Partial<StxOptions>, { __stx_native_screen: true })
    expect(scripts(html)).not.toContain('WEB_STAND_IN_SENTINEL')
    expect(scripts(html)).toContain('PHONE_ONLY_FORGET')
  })

  it('bundles the real modules, with a warning, when a stand-in is missing', async () => {
    process.env.STX_PAGE_MESSAGES = '1'
    const warn = spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const html = await render({ webModules: { 'functions/native-auth.ts': 'web/missing.ts' } } as Partial<StxOptions>)
      expect(scripts(html)).toContain('PHONE_ONLY_FORGET')
      expect(tagged(html, 'data-stx-messages')).toContain('EN_PLAYER_PAUSE')
    }
    finally {
      warn.mockRestore()
    }
  })

  it('refuses a missing module, and relative imports that would resolve from elsewhere', async () => {
    await expect(loadWebModules(APP, { 'functions/gone.ts': 'web/native-auth.ts' })).rejects.toThrow('functions/gone.ts does not exist')
    await expect(loadWebModules(APP, { 'functions/native-auth.ts': 'web/missing.ts' })).rejects.toThrow('does not exist')
    await expect(loadWebModules(APP, { 'functions/native-auth.ts': 'functions/native-auth.ts' })).rejects.toThrow('stands in for itself')
    write('web/relative.ts', [`import { PLAYER_KEYS } from '../functions/player-session'`, `export const keys = PLAYER_KEYS`])
    await expect(loadWebModules(APP, { 'functions/native-auth.ts': 'web/relative.ts' })).rejects.toThrow('imports ../functions/player-session')
    // Beside the module it replaces, a relative import means the same thing.
    write('functions/native-auth.web.ts', [`import { PLAYER_KEYS } from './player-session'`, `export const keys = PLAYER_KEYS`])
    const standIns = await loadWebModules(APP, { 'functions/native-auth.ts': 'functions/native-auth.web.ts' })
    expect(standIns.get(path.join(APP, 'functions/native-auth.ts'))).toContain('./player-session')
  })

  it('answers TypeScript as JavaScript, read again when the stand-in changes', async () => {
    const first = (await loadWebModules(APP, webModules)).get(path.join(APP, 'functions/native-auth.ts'))!
    expect(first).not.toContain('interface')
    expect(first).toContain('WEB_STAND_IN_SENTINEL')
    const file = path.join(APP, 'web/native-auth.ts')
    const before = fs.readFileSync(file, 'utf8')
    try {
      fs.writeFileSync(file, `export function nativeAuthFor(): null { return (globalThis as any).CHANGED_SENTINEL ?? null }\n`)
      const later = new Date(Date.now() + 5000)
      fs.utimesSync(file, later, later)
      expect((await loadWebModules(APP, webModules)).get(path.join(APP, 'functions/native-auth.ts'))).toContain('CHANGED_SENTINEL')
    }
    finally {
      fs.writeFileSync(file, before)
    }
  })
})
