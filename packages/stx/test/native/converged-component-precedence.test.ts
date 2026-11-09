/**
 * A converged name resolves to the shared component, not to a file a recursive
 * search happened to find under that name (stacksjs/stx#2175).
 *
 * `<Button title=… symbol=… iconOnly>` used to be pinned to the native
 * primitive, so it never entered component name resolution at all. Converging
 * its desktop API onto the shared component (#2091) sent it into that search
 * for the first time — and the package holding the shared file is searched
 * below every project directory, so an app whose web dashboard had a
 * `Dashboard/UI/Button.stx` got that on its native screens: markup the native
 * compiler cannot render, and 71 unknown-class/unknown-icon diagnostics naming
 * it. The regression therefore arrived with the convergence rather than with
 * any ordering change.
 *
 * The predicates decide per invocation, from the call's own props and events,
 * so it is that decision which has to reach the file. An override is still an
 * override — a file the app itself named `Button.stx`, in one of its component
 * roots — and the cases below are the whole boundary: that direct override
 * still wins, the web path is untouched, a call the predicates do NOT select
 * is untouched, and an explicit `@import` outranks all of it.
 */
import { expect, it } from 'bun:test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { compileScreenSource, nativePrimitivesDir } from '../../src/native/compiler/render-screen'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { clearComponentCache } from '../../src/utils'

const componentsPkg = join(import.meta.dir, '../../../components')
const sharedButton = join(componentsPkg, 'src/ui/button/Button.stx')
const primitiveButton = join(nativePrimitivesDir(), 'Button.stx')

/** An app that owns a `Button.stx` of its own, nested as a real one is. */
async function appWithItsOwnButton(): Promise<{ root: string, hostButton: string }> {
  const root = createTempDir('stx-converged-precedence-')
  await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: [${JSON.stringify(join(componentsPkg, 'stx-plugin.ts'))}] }`)
  await mkdir(join(root, 'components', 'Dashboard', 'UI'), { recursive: true })
  const hostButton = join(root, 'components', 'Dashboard', 'UI', 'Button.stx')
  await Bun.write(hostButton, '<button data-host-dashboard-button="yes" class="aria-disabled:opacity-40"><slot /></button>\n')
  return { root, hostButton }
}

async function compile(root: string, source: string): Promise<string[]> {
  clearComponentCache()
  const file = join(root, 'Screen.stx')
  await Bun.write(file, source)
  const compiled = await compileScreenSource(source, file, { root })
  return [...compiled.dependencies]
}

it('a converged <Button> resolves to the shared component even when the app owns that name', async () => {
  const { root, hostButton } = await appWithItsOwnButton()
  for (const tag of [
    '<Button label="Share Report" />',
    '<Button title="Share Report" symbol="square.and.arrow.up" />',
    '<Button iconOnly symbol="gear" title="Settings" />',
  ]) {
    const dependencies = await compile(root, `<div>${tag}</div>`)
    expect(dependencies).toContain(sharedButton)
    expect(dependencies).not.toContain(hostButton)
  }
}, 30_000)

it('the same app, on the web, still gets its own Button — app-first precedence is unchanged (#2927)', async () => {
  const { root, hostButton } = await appWithItsOwnButton()
  clearComponentCache()
  const file = join(root, 'Page.stx')
  const source = '<div><Button label="Share Report" /></div>'
  await Bun.write(file, source)
  const dependencies = new Set<string>()
  const html = await processDirectives(source, {}, file, { root, componentsDir: join(root, 'components'), cache: false }, dependencies)
  expect(html).toContain('data-host-dashboard-button')
  expect([...dependencies]).toContain(hostButton)
}, 30_000)

it('a call the predicates do not select is untouched: a host-drawn variant keeps the old resolution', async () => {
  const { root, hostButton } = await appWithItsOwnButton()
  const dependencies = await compile(root, '<div><Button variant="toolbar" title="Share" symbol="gear" /></div>')
  // Not the shared component: `toolbar` is the host's own control, and the
  // splice above is scoped to the invocations the predicates select. What
  // answers instead is whatever the ordinary search finds, exactly as before.
  expect(dependencies).not.toContain(sharedButton)
  expect(dependencies.some(dependency => dependency === hostButton || dependency === primitiveButton)).toBe(true)
}, 30_000)

it('an app that names the component itself still overrides it', async () => {
  const { root } = await appWithItsOwnButton()
  // The distinction the fix turns on: `components/Button.stx` is the app
  // saying what its `<Button>` is; `components/Dashboard/UI/Button.stx` is a
  // Dashboard's button that a recursive search happened to reach.
  const named = join(root, 'components', 'Button.stx')
  await Bun.write(named, '<button data-app-button="yes"><slot /></button>\n')
  const dependencies = await compile(root, '<div><Button label="Share Report" /></div>')
  expect(dependencies).toContain(named)
  expect(dependencies).not.toContain(sharedButton)
}, 30_000)

it('an explicit @import still outranks the converged component', async () => {
  const { root, hostButton } = await appWithItsOwnButton()
  const dependencies = await compile(root, `@import('Button', ${JSON.stringify(hostButton)})\n<div><Button label="Share Report" /></div>`)
  expect(dependencies).toContain(hostButton)
  expect(dependencies).not.toContain(sharedButton)
}, 30_000)
