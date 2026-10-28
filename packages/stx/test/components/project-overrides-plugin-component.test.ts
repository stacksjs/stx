import { describe, expect, it } from 'bun:test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { processDirectives } from '../../src'
import { createTempDir } from '../../src/temp-dir'

/**
 * A plugin supplies a DEFAULT component. A component the project actually
 * wrote is not a fallback to it — it is the answer.
 *
 * While plugin directories were searched first, a project holding its own
 * `resources/components/AppShell.stx` still rendered the plugin's copy. The
 * symptom never pointed at precedence: what the author saw was the PLUGIN
 * file's relative includes failing, with ENOENT naming a directory inside an
 * installed package that they had never written a path to.
 */
describe('component resolution precedence', () => {
  it("prefers the project's own component over a plugin's of the same name", async () => {
    const root = createTempDir('stx-precedence-')
    try {
      const projectComponents = path.join(root, 'resources/components')
      const pluginComponents = path.join(root, 'node_modules/some-plugin/components')
      await mkdir(projectComponents, { recursive: true })
      await mkdir(pluginComponents, { recursive: true })

      await writeFile(path.join(projectComponents, 'AppShell.stx'), '<div>PROJECT SHELL</div>')
      await writeFile(path.join(pluginComponents, 'AppShell.stx'), '<div>PLUGIN SHELL</div>')

      const page = path.join(root, 'page.stx')
      await writeFile(page, '<AppShell />')

      const output = await processDirectives(
        '<AppShell />',
        {},
        page,
        {
          root,
          componentsDir: projectComponents,
          _pluginComponentDirs: [pluginComponents],
        } as any,
        new Set(),
      )

      expect(output).toContain('PROJECT SHELL')
      expect(output).not.toContain('PLUGIN SHELL')
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it("still resolves a plugin's component when the project has none", async () => {
    const root = createTempDir('stx-precedence-')
    try {
      const pluginComponents = path.join(root, 'node_modules/some-plugin/components')
      await mkdir(path.join(root, 'resources/components'), { recursive: true })
      await mkdir(pluginComponents, { recursive: true })
      await writeFile(path.join(pluginComponents, 'Notification.stx'), '<div>PLUGIN NOTIFICATION</div>')

      const page = path.join(root, 'page.stx')
      await writeFile(page, '<Notification />')

      const output = await processDirectives(
        '<Notification />',
        {},
        page,
        {
          root,
          componentsDir: path.join(root, 'resources/components'),
          _pluginComponentDirs: [pluginComponents],
        } as any,
        new Set(),
      )

      expect(output).toContain('PLUGIN NOTIFICATION')
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

/**
 * `fallbackComponentsDir` is the component-side counterpart of
 * `fallbackLayoutsDir`. Without it a host had one bad choice: point
 * `componentsDir` at the framework defaults and an app can never override a
 * component, or point it at the app and every framework component stops
 * resolving.
 */
describe('fallbackComponentsDir', () => {
  it("lets the app override by name while the framework's own still resolve", async () => {
    const root = createTempDir('stx-fallback-')
    try {
      const app = path.join(root, 'resources/components')
      const framework = path.join(root, 'framework/components')
      await mkdir(app, { recursive: true })
      await mkdir(framework, { recursive: true })

      // Same name in both — the app must win.
      await writeFile(path.join(app, 'AppShell.stx'), '<div>APP SHELL</div>')
      await writeFile(path.join(framework, 'AppShell.stx'), '<div>FRAMEWORK SHELL</div>')
      // Only the framework has this one — it must still resolve.
      await writeFile(path.join(framework, 'Notification.stx'), '<div>FRAMEWORK NOTIFICATION</div>')

      const page = path.join(root, 'page.stx')
      await writeFile(page, '<AppShell /><Notification />')

      const output = await processDirectives(
        '<AppShell /><Notification />',
        {},
        page,
        { root, componentsDir: app, fallbackComponentsDir: framework } as any,
        new Set(),
      )

      expect(output).toContain('APP SHELL')
      expect(output).not.toContain('FRAMEWORK SHELL')
      expect(output).toContain('FRAMEWORK NOTIFICATION')
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})

/**
 * The fallback's own components render each other by name, and a nested
 * component resolves beside its parent first. So an app's copy of a framework
 * component lost wherever a framework sibling rendered it: an app
 * `Container.stx` was ignored inside every framework marketing section that
 * renders `<Container>` from the same folder (stacksjs/stacks#3033).
 */
describe('fallbackComponentsDir siblings', () => {
  it("lets the app override a component its framework sibling renders", async () => {
    const root = createTempDir('stx-fallback-sibling-')
    try {
      const app = path.join(root, 'resources/components')
      const framework = path.join(root, 'framework/components')
      await mkdir(path.join(app, 'Marketing'), { recursive: true })
      await mkdir(path.join(framework, 'Marketing'), { recursive: true })

      await writeFile(path.join(framework, 'Marketing/Header.stx'), '<header>HEADER <Container /></header>')
      await writeFile(path.join(framework, 'Marketing/Container.stx'), '<div>FRAMEWORK CONTAINER</div>')
      await writeFile(path.join(app, 'Marketing/Container.stx'), '<div>APP CONTAINER</div>')

      const page = path.join(root, 'page.stx')
      await writeFile(page, '<Header />')
      const output = await processDirectives('<Header />', {}, page, { root, componentsDir: app, fallbackComponentsDir: framework } as any, new Set())

      expect(output).toContain('APP CONTAINER')
      expect(output).not.toContain('FRAMEWORK CONTAINER')
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('still renders the framework sibling when the app has none', async () => {
    const root = createTempDir('stx-fallback-sibling-')
    try {
      const app = path.join(root, 'resources/components')
      const framework = path.join(root, 'framework/components')
      await mkdir(app, { recursive: true })
      await mkdir(path.join(framework, 'Marketing'), { recursive: true })

      await writeFile(path.join(framework, 'Marketing/Header.stx'), '<header>HEADER <Container /></header>')
      await writeFile(path.join(framework, 'Marketing/Container.stx'), '<div>FRAMEWORK CONTAINER</div>')
      await writeFile(path.join(framework, 'Container.stx'), '<div>TOP-LEVEL CONTAINER</div>')

      const page = path.join(root, 'page.stx')
      await writeFile(page, '<Header />')
      const output = await processDirectives('<Header />', {}, page, { root, componentsDir: app, fallbackComponentsDir: framework } as any, new Set())

      // The sibling, not another framework component of the same name.
      expect(output).toContain('FRAMEWORK CONTAINER')
      expect(output).not.toContain('TOP-LEVEL CONTAINER')
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
