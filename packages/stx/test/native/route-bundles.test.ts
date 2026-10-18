/**
 * `routesDir`: one self-contained bundle per route. Each native screen is a
 * JavaScriptCore context that evaluates the whole file it is handed, so a
 * route's file must hold that screen alone and still run on its own.
 */
import { describe, expect, it } from 'bun:test'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { compileNativeBundle } from '../../src/native/compiler/bundle'
import { NATIVE_APP_ROUTE } from '../../src/native/runtime/shared-screen'
import { createTempDir } from '../../src/temp-dir'

const root = createTempDir('stx-route-bundles-')
await Bun.write(path.join(root, 'Home.stx'), '<script client>const homeOnlyMarker = "home-screen-code"</script><View><Text>Home</Text></View>')
await Bun.write(path.join(root, 'Details.stx'), '<script client>const detailsOnlyMarker = "details-screen-code"</script><View><Text>Details</Text></View>')
await Bun.write(path.join(root, 'app.ts'), 'export default function app() { globalThis.__appRan = "app-script-code" }\n')
const result = await compileNativeBundle({ root, screens: { Home: 'Home.stx', Details: 'Details.stx' }, app: 'app.ts', routesDir: 'routes' })

function run(code: string, route: string) {
  const sent: Array<Record<string, any>> = []
  const scope: Record<string, any> = {
    __stxNativeRoute: route,
    __stxNativeParams: {},
    __stxNativeBridge: {
      platform: 'ios',
      mutationProtocolVersion: 1,
      capabilityProtocolVersion: 1,
      capabilityTimeoutMs: 1000,
      capabilities: [],
      onMessage: () => {},
      postMessage: (raw: string) => { sent.push(JSON.parse(raw)) },
    },
    setTimeout,
    clearTimeout,
  }
  vm.runInNewContext(code, scope)
  return { scope, sent }
}

describe('route bundles', () => {
  it('writes a file per screen and one for the app script, and no one-file bundle', () => {
    expect(readdirSync(path.join(root, 'routes')).sort()).toEqual(['Details.js', 'Home.js', `${NATIVE_APP_ROUTE}.js`].sort())
    expect(result.routes).toEqual({
      Home: path.join(root, 'routes', 'Home.js'),
      Details: path.join(root, 'routes', 'Details.js'),
      [NATIVE_APP_ROUTE]: path.join(root, 'routes', `${NATIVE_APP_ROUTE}.js`),
    })
    expect(result.code).toBe('')
    expect(result.outFile).toBeUndefined()
  })

  it('keeps each screen\'s code out of every other route\'s file', () => {
    const home = readFileSync(result.routes!.Home, 'utf8')
    const details = readFileSync(result.routes!.Details, 'utf8')
    const app = readFileSync(result.routes![NATIVE_APP_ROUTE], 'utf8')
    expect(home).toContain('home-screen-code')
    expect(home).not.toContain('details-screen-code')
    expect(home).not.toContain('app-script-code')
    expect(details).toContain('details-screen-code')
    expect(details).not.toContain('home-screen-code')
    expect(app).toContain('app-script-code')
    expect(app).not.toContain('home-screen-code')
  })

  it('renders its own screen on its own', () => {
    const { sent } = run(readFileSync(result.routes!.Details, 'utf8'), 'Details')
    const render = sent.find(message => message.type === 'RENDER')
    expect(JSON.stringify(render?.payload.document)).toContain('Details')
    expect(JSON.stringify(render?.payload.document)).not.toContain('Home')
  })

  it('runs the app script from its file', () => {
    const { scope, sent } = run(readFileSync(result.routes![NATIVE_APP_ROUTE], 'utf8'), NATIVE_APP_ROUTE)
    expect(scope.__appRan).toBe('app-script-code')
    expect(sent.some(message => message.type === 'RENDER')).toBe(false)
  })

  it('refuses a route its file does not hold, rather than drawing nothing', () => {
    expect(() => run(readFileSync(result.routes!.Home, 'utf8'), 'Details')).toThrow('This bundle does not hold the native screen Details')
    expect(() => run(readFileSync(result.routes!.Home, 'utf8'), NATIVE_APP_ROUTE)).toThrow('This bundle does not hold the native screen')
  })

  it('ships the screen as compiled, minified code, never as its source text', async () => {
    await Bun.write(path.join(root, 'Commented.stx'), `<script client>
// A comment that only the source has.
const commentedScreenCount = state(1)
</script><View><Text :text="String(commentedScreenCount())" /></View>`)
    const minified = await compileNativeBundle({ root, screens: { Commented: 'Commented.stx' }, minify: true, routesDir: 'minified-routes' })
    const code = readFileSync(minified.routes!.Commented, 'utf8')
    expect(code).not.toContain('A comment that only the source has')
    expect(code).not.toContain('commentedScreenCount = state(1)')
    const { sent } = run(code, 'Commented')
    expect(sent.some(message => message.type === 'RENDER')).toBe(true)
    // The binding still reads the setup's signal: the compiled code runs.
    expect(JSON.stringify(sent.filter(message => message.type !== 'RENDER'))).toContain('"1"')
  })

  it('still builds the one-file bundle beside the routes when outFile is given', async () => {
    const both = await compileNativeBundle({ root, screens: { Home: 'Home.stx', Details: 'Details.stx' }, routesDir: 'both-routes', outFile: 'native-screen.js' })
    expect(both.outFile).toBe(path.join(root, 'native-screen.js'))
    expect(both.code).toContain('home-screen-code')
    expect(both.code).toContain('details-screen-code')
    expect(Object.keys(both.routes!).sort()).toEqual(['Details', 'Home'])
  })
})
