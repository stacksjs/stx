/**
 * An inline test screen compiles against the project's packages, and a
 * package that is only in Bun's install cache is not installed.
 *
 * `compileNativeScreen` writes its source to a temp folder. With no
 * `node_modules` there, Bun's `require.resolve` answered from its global
 * install cache: the component library an inline screen compiled was whatever
 * copy an earlier install had left on the machine (0.2.849, checked against an
 * app on 0.2.851), and no library at all on a machine with an empty cache. A
 * fix published in the library was therefore invisible to exactly the tests
 * meant to show it.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { resolveInstalledPackage } from '../../src/config'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

afterEach(unmountAllNativeScreens)

/** A project whose installed component library holds one component of its own. */
async function projectWithLibrary(marker: string): Promise<string> {
  const project = createTempDir('stx-inline-project-')
  const library = join(project, 'node_modules/@stacksjs/components')
  mkdirSync(join(library, 'ui'), { recursive: true })
  await Bun.write(join(library, 'package.json'), JSON.stringify({ name: '@stacksjs/components', version: '0.0.0-test', exports: { './stx-plugin': './stx-plugin.ts' } }))
  await Bun.write(join(library, 'stx-plugin.ts'), `export default { name: '@stacksjs/components', components: ['./ui'] }\n`)
  await Bun.write(join(library, 'ui/ProjectOnlyBadge.stx'), `<span>${marker}</span>\n`)
  return project
}

describe('a package the project has installed', () => {
  it('is not one that sits only in the install cache, or nowhere', () => {
    const empty = createTempDir('stx-no-install-')
    expect(() => resolveInstalledPackage('@stacksjs/components/stx-plugin', empty)).toThrow()
  })

  it('resolves from the project', async () => {
    const project = await projectWithLibrary('here')
    const resolved = resolveInstalledPackage('@stacksjs/components/stx-plugin', project)
    expect(resolved).toContain('stx-inline-project-')
    expect(resolved).not.toMatch(/install[\\/]cache/)
  })
})

describe('an inline native screen', () => {
  it('uses the component library of the project testing it', async () => {
    const project = await projectWithLibrary('from the project')
    const { code } = await compileNativeScreen('<section><ProjectOnlyBadge /></section>', { project })
    const phone = mountNativeScreen(code, 'Screen', { platform: 'ios' })
    await phone.settle()
    expect(phone.texts()).toContain('from the project')
  }, 30_000)

  it('keeps two projects apart', async () => {
    const first = await projectWithLibrary('first project')
    const second = await projectWithLibrary('second project')
    const texts = async (project: string): Promise<string[]> => {
      const { code } = await compileNativeScreen('<section><ProjectOnlyBadge /></section>', { project })
      const phone = mountNativeScreen(code, 'Screen', { platform: 'ios' })
      await phone.settle()
      return phone.texts()
    }
    expect(await texts(first)).toContain('first project')
    expect(await texts(second)).toContain('second project')
  }, 30_000)
})
