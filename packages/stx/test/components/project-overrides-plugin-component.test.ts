import { describe, expect, it } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { processDirectives } from '../../src'

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
    const root = await mkdtemp(path.join(tmpdir(), 'stx-precedence-'))
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
    const root = await mkdtemp(path.join(tmpdir(), 'stx-precedence-'))
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
    const root = await mkdtemp(path.join(tmpdir(), 'stx-fallback-'))
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
