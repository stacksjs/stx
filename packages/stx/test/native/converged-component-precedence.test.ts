/**
 * A name with a shared counterpart resolves to what the predicates chose, not
 * to a file a recursive search happened to find under that name
 * (stacksjs/stx#2175).
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
 * Both answers are treated alike, because the defect runs in both directions:
 * a `variant="toolbar"` button is the host's own control and selects the
 * primitive, and the identical nested file was intercepting that too.
 *
 * The predicates decide per invocation, from the call's own props and events,
 * so it is that decision which has to reach the file. An override is still an
 * override — a file the app itself named `Button.stx`, in one of its component
 * roots — and the cases below are the whole boundary: a direct override still
 * wins either way, the web path is untouched, and an explicit `@import`
 * outranks all of it.
 */
import { expect, it } from 'bun:test'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { loadStxConfig } from '../../src/config'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { compileScreenSource, nativePrimitivesDir } from '../../src/native/compiler/render-screen'
import { mountNativeScreen } from '../../src/native/testing'
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

it('a call that selects the primitive reaches the primitive, not a nested file of the same name', async () => {
  const { root, hostButton } = await appWithItsOwnButton()
  // `toolbar` is the host's own control, so the predicates deliberately keep
  // it on the native primitive rather than converging it. That selection is a
  // decision about the render target just as much as the shared one is, and
  // the identical nested Dashboard file was intercepting it.
  const dependencies = await compile(root, '<div><Button variant="toolbar" title="Share" symbol="gear" /></div>')
  expect(dependencies).toContain(primitiveButton)
  expect(dependencies).not.toContain(hostButton)
  expect(dependencies).not.toContain(sharedButton)
}, 30_000)

it('a primitive-selected call still yields to a component the app names itself', async () => {
  const { root } = await appWithItsOwnButton()
  const named = join(root, 'components', 'Button.stx')
  await Bun.write(named, '<button data-app-button="yes"><slot /></button>\n')
  const dependencies = await compile(root, '<div><Button variant="toolbar" title="Share" symbol="gear" /></div>')
  expect(dependencies).toContain(named)
  expect(dependencies).not.toContain(primitiveButton)
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

it('reaches the component library past a plugin that lists a framework directory first', async () => {
  // A Stacks app's `config/ui.ts` registers the framework's own components
  // plugin, which lists `resources/components` ahead of the library on
  // purpose: on the web a package must not replace a framework component of
  // the same name. Ranking every plugin root first therefore handed a native
  // `<Button>` the framework's nested `Dashboard/UI/Button.stx` again
  // (stacksjs/stx#2177). The library's roots are the ones the convergence
  // named, so they are the ones that have to win here.
  const root = createTempDir('stx-converged-library-')
  await mkdir(join(root, 'framework', 'components', 'Dashboard', 'UI'), { recursive: true })
  const frameworkButton = join(root, 'framework', 'components', 'Dashboard', 'UI', 'Button.stx')
  await Bun.write(frameworkButton, '<button data-framework-button="yes" class="aria-disabled:opacity-40"><slot /></button>\n')
  await Bun.write(join(root, 'framework', 'plugin.ts'), 'export default { name: \'@stacksjs/defaults\', components: [\'./components\'] }\n')
  await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: [${JSON.stringify(join(root, 'framework', 'plugin.ts'))}, ${JSON.stringify(join(componentsPkg, 'stx-plugin.ts'))}] }`)
  const dependencies = await compile(root, '<div><Button label="Share Report" /></div>')
  expect(dependencies).toContain(sharedButton)
  expect(dependencies).not.toContain(frameworkButton)
}, 30_000)

it('an explicit @import still outranks the converged component', async () => {
  const { root, hostButton } = await appWithItsOwnButton()
  const dependencies = await compile(root, `@import('Button', ${JSON.stringify(hostButton)})\n<div><Button label="Share Report" /></div>`)
  expect(dependencies).toContain(hostButton)
  expect(dependencies).not.toContain(sharedButton)
}, 30_000)

it('recognises library roots supplied by a framework wrapper without changing its other defaults', async () => {
  // The public compiler is also used with a scratch project and an absolute
  // framework plugin, as in stacksjs/stacks#3213. That plugin contributes the
  // installed library root itself: the scratch project has no node_modules
  // from which stx could auto-register the library's own plugin.
  const root = createTempDir('stx-converged-wrapper-')
  const framework = join(root, 'framework')
  const frameworkButton = join(framework, 'components/Dashboard/UI/Button.stx')
  const frameworkAvatar = join(framework, 'components/Dashboard/UI/Avatar.stx')
  await Bun.write(frameworkButton, '<button data-framework-button="yes" class="aria-disabled:opacity-40"><slot /></button>\n')
  await Bun.write(frameworkAvatar, '<span data-framework-avatar="yes" class="aria-disabled:opacity-40">Framework avatar</span>\n')
  const plugin = join(framework, 'plugin.ts')
  await Bun.write(plugin, `export default { name: '@stacksjs/defaults/components', components: ['./components', ${JSON.stringify(join(componentsPkg, 'src/ui'))}] }`)
  await Bun.write(join(root, 'stx.config.ts'), `export default { plugins: [${JSON.stringify(plugin)}] }`)

  const source = '<Button label="Share Report" />'
  const file = join(root, 'Screen.stx')
  await Bun.write(file, source)
  const native = await compileScreenSource(source, file, { root })
  expect(native.dependencies).toContain(sharedButton)
  expect(native.dependencies).not.toContain(frameworkButton)
  expect(native.diagnostics.filter(entry => entry.kind !== 'dropped-subtree')).toEqual([])
  const { code } = await compileSharedScreenBundle(file, { root })
  const screen = mountNativeScreen(code, 'Screen')
  try {
    await screen.settle()
    expect(screen.texts()).toContain('Share Report')
  }
  finally { screen.unmount() }

  const avatar = await compileScreenSource('<Avatar initials="AL" />', file, { root })
  expect(avatar.dependencies).toContain(frameworkAvatar)
  expect(avatar.diagnostics.some(entry => entry.kind === 'unknown-class')).toBe(true)

  const loaded = await loadStxConfig(root)
  const dependencies = new Set<string>()
  const html = await processDirectives('<div><Button label="Share Report" /><Avatar initials="AL" /></div>', {}, file, { ...loaded, root, cache: false }, dependencies)
  expect(dependencies.has(frameworkButton)).toBe(true)
  expect(dependencies.has(frameworkAvatar)).toBe(true)
  expect(dependencies.has(sharedButton)).toBe(false)
  expect(html).toContain('data-framework-button')
  expect(html).toContain('data-framework-avatar')
}, 30_000)
