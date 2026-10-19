/**
 * `messages` with `routesDir`: route files carry no message text. A screen
 * reads its language's messages for an area the first time it looks inside
 * them, from `__messages/<language>/<area>.json`, so a screen shown in
 * German never parses the English, nor an area it does not use.
 */
import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { compileNativeBundle, NATIVE_MESSAGES_DIR } from '../../src/native/compiler/bundle'
import { createTempDir } from '../../src/temp-dir'

const root = createTempDir('stx-route-messages-')
await Bun.write(path.join(root, 'lang/en/greet.ts'), 'export default { hello: \'Hello there\', nested: { bye: \'Goodbye now\' } }\n')
await Bun.write(path.join(root, 'lang/de/greet.ts'), 'export default { hello: \'Hallo zusammen\', nested: { bye: \'Tschuess dann\' } }\n')
await Bun.write(path.join(root, 'lang/en/unused.ts'), 'export default { only: \'Never shipped in a route\' }\n')
await Bun.write(path.join(root, 'lang/de/unused.ts'), 'export default { only: \'Nie in einer Route\' }\n')
// The app's own runtime, as HQ's: a catalog per area, English as the fallback.
await Bun.write(path.join(root, 'catalog.ts'), `import en from './lang/en/greet'
import de from './lang/de/greet'
const catalog: Record<string, any> = { en, de }
export function t(language: string, key: string): string {
  const find = (messages: any) => key.split('.').reduce((node, part) => node == null || typeof node === 'string' ? undefined : node[part], messages)
  return find(catalog[language]) ?? find(catalog.en) ?? key
}
`)
await Bun.write(path.join(root, 'Home.stx'), '<script client>import { t } from \'./catalog\'\nglobalThis.__said = [t(globalThis.__language, \'hello\'), t(globalThis.__language, \'nested.bye\')]</script><View><Text>Home</Text></View>')
await Bun.write(path.join(root, 'Plain.stx'), '<View><Text>Plain</Text></View>')
const result = await compileNativeBundle({ root, screens: { Home: 'Home.stx', Plain: 'Plain.stx' }, routesDir: 'routes', sharedRuntime: true, messages: { dir: 'lang', languages: ['en', 'de'] } })
const messagesDir = path.join(root, 'routes', NATIVE_MESSAGES_DIR)

function run(route: string, language: string, host: { read?: boolean, preload?: Record<string, Record<string, unknown>> } = { read: true }) {
  const reads: string[] = []
  const scope: Record<string, any> = {
    __language: language,
    __stxNativeRoute: route,
    __stxNativeParams: {},
    __stxNativeBridge: {
      platform: 'ios',
      mutationProtocolVersion: 1,
      capabilityProtocolVersion: 1,
      capabilityTimeoutMs: 1000,
      capabilities: [],
      onMessage: () => {},
      postMessage: () => {},
    },
    setTimeout,
    clearTimeout,
  }
  if (host.read) {
    scope.__stxNativeReadMessages = (lang: string, area: string) => {
      reads.push(`${lang}/${area}`)
      const file = path.join(messagesDir, lang, `${area}.json`)
      return existsSync(file) ? readFileSync(file, 'utf8') : null
    }
  }
  if (host.preload) scope.__stxNativeMessages = host.preload
  const context = vm.createContext(scope)
  vm.runInContext(readFileSync(result.runtime!, 'utf8'), context)
  vm.runInContext(readFileSync(result.routes![route]!, 'utf8'), context)
  return { scope, reads }
}

describe('route messages', () => {
  it('writes each language\'s areas as JSON, and which areas each route uses', () => {
    expect(JSON.parse(readFileSync(path.join(messagesDir, 'de', 'greet.json'), 'utf8'))).toEqual({ hello: 'Hallo zusammen', nested: { bye: 'Tschuess dann' } })
    expect(JSON.parse(readFileSync(path.join(messagesDir, 'en', 'unused.json'), 'utf8'))).toEqual({ only: 'Never shipped in a route' })
    expect(JSON.parse(readFileSync(path.join(messagesDir, 'routes.json'), 'utf8'))).toEqual({ Home: ['greet'], Plain: [] })
    expect(result.messages).toEqual({ dir: messagesDir, languages: ['en', 'de'], routes: { Home: ['greet'], Plain: [] } })
  })

  it('keeps every language\'s text out of the route files', () => {
    const home = readFileSync(result.routes!.Home!, 'utf8')
    for (const text of ['Hello there', 'Hallo zusammen', 'Goodbye now', 'Tschuess dann', 'Never shipped'])
      expect(home).not.toContain(text)
    expect(home).toContain('__stxNativeRuntime.messages("de", "greet")')
  })

  it('reads only the language a screen is shown in, once, when it first looks', () => {
    const { scope, reads } = run('Home', 'de')
    expect(scope.__said).toEqual(['Hallo zusammen', 'Tschuess dann'])
    expect(reads).toEqual(['de/greet'])
  })

  it('reads another language when it is asked for, as a fallback or a change of language', () => {
    const { scope, reads } = run('Home', 'en')
    expect(scope.__said).toEqual(['Hello there', 'Goodbye now'])
    expect(reads).toEqual(['en/greet'])
    const { scope: unknown, reads: tried } = run('Home', 'fr')
    // No French: the app's own fallback reads the English.
    expect(unknown.__said).toEqual(['Hello there', 'Goodbye now'])
    expect(tried).toEqual(['en/greet'])
  })

  it('takes the messages a host evaluated first, when it cannot read a file synchronously', () => {
    const preload = { de: { greet: JSON.parse(readFileSync(path.join(messagesDir, 'de', 'greet.json'), 'utf8')) } }
    const { scope } = run('Home', 'de', { read: false, preload })
    expect(scope.__said).toEqual(['Hallo zusammen', 'Tschuess dann'])
  })

  it('shows a missing area as no messages, never a crash', () => {
    const { scope } = run('Home', 'de', { read: false })
    expect(scope.__said).toEqual(['hello', 'nested.bye'])
  })

  it('looks like the plain data it stands for', () => {
    const { scope } = run('Home', 'de')
    const messages = vm.runInContext('__stxNativeRuntime.messages("de", "greet")', vm.createContext(scope))
    expect(Object.keys(messages)).toEqual(['hello', 'nested'])
    expect('hello' in messages).toBe(true)
    expect('missing' in messages).toBe(false)
    expect(JSON.parse(JSON.stringify(messages))).toEqual({ hello: 'Hallo zusammen', nested: { bye: 'Tschuess dann' } })
  })

  it('leaves the languages out of a minified build and of the app script\'s own imports', async () => {
    await Bun.write(path.join(root, 'app.ts'), 'import { t } from \'./catalog\'\nexport default function app() { globalThis.__appSaid = t(globalThis.__language, \'hello\') }\n')
    const minified = await compileNativeBundle({ root, screens: { Home: 'Home.stx' }, app: 'app.ts', minify: true, routesDir: 'minified', sharedRuntime: true, messages: { dir: 'lang', languages: ['en', 'de'] } })
    expect(minified.messages!.routes).toEqual({ Home: ['greet'], __app: ['greet'] })
    for (const file of Object.values(minified.routes!)) {
      const code = readFileSync(file, 'utf8')
      expect(code).not.toContain('Hallo zusammen')
      expect(code).not.toContain('Hello there')
    }
  })

  it('bundles the real messages for a build beside it, from the same cache', async () => {
    // The screens' scripts above were bundled with stand-ins; a web build of
    // the same script must not be handed that copy.
    const plain = await compileNativeBundle({ root, screens: { Home: 'Home.stx' }, routesDir: 'plain', sharedRuntime: true })
    const home = readFileSync(plain.routes!.Home!, 'utf8')
    expect(home).toContain('Hallo zusammen')
    expect(home).not.toContain('__stxNativeRuntime.messages(')
  })

  it('refuses message modules a route file could not stand in for', async () => {
    const bad = createTempDir('stx-route-messages-bad-')
    await Bun.write(path.join(bad, 'Home.stx'), '<View><Text>Home</Text></View>')
    await Bun.write(path.join(bad, 'named/en/a.ts'), 'export const extra = 1\nexport default { a: \'A\' }\n')
    await Bun.write(path.join(bad, 'code/en/a.ts'), 'export default { a: () => \'A\' }\n')
    const compile = (dir: string, languages = ['en'], routesDir: string | null = 'routes') => compileNativeBundle({ root: bad, screens: { Home: 'Home.stx' }, routesDir: routesDir ?? undefined, sharedRuntime: routesDir !== null, messages: { dir, languages } })
    await expect(compile('named')).rejects.toThrow('exports extra')
    await expect(compile('code')).rejects.toThrow('plain data')
    await expect(compile('named', ['fr'])).rejects.toThrow('does not exist')
    await expect(compile('named', ['../x'])).rejects.toThrow('not a language')
    await expect(compile('named', ['en'], null)).rejects.toThrow('need routesDir')
    await expect(compileNativeBundle({ root: bad, screens: { Home: 'Home.stx' }, routesDir: 'routes', messages: { dir: 'named', languages: ['en'] } })).rejects.toThrow('need sharedRuntime')
  })
})
