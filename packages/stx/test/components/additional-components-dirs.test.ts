import { describe, expect, it } from 'bun:test'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { processDirectives } from '../../src'
import { createTempDir } from '../../src/temp-dir'

/**
 * `additionalComponentsDirs` are searched, in order, right after
 * `componentsDir` and ahead of every plugin and fallback directory.
 *
 * The Stacks dashboard is the case it exists for (stacksjs/stx#2130). Its own
 * components live in the framework, an app must be able to override one by
 * name, and `@stacksjs/components` (registered as a plugin directory) shares
 * names with them, so the framework's own have to rank above the plugin's.
 * `fallbackComponentsDir` ranks below plugins and cannot express that.
 */
describe('additionalComponentsDirs', () => {
  async function render(root: string, template: string, options: Record<string, unknown>): Promise<string> {
    const page = path.join(root, 'page.stx')
    await writeFile(page, template)
    return processDirectives(template, {}, page, { root, ...options } as any, new Set())
  }

  it('lets the app override a nested framework component while the rest still resolve', async () => {
    const root = createTempDir('stx-additional-')
    try {
      const app = path.join(root, 'app/components/Dashboard')
      const framework = path.join(root, 'framework/components/Dashboard')
      await mkdir(path.join(app, 'Commerce'), { recursive: true })
      await mkdir(path.join(framework, 'Commerce'), { recursive: true })

      await writeFile(path.join(app, 'Commerce/OrdersTable.stx'), '<div>APP ORDERS</div>')
      await writeFile(path.join(framework, 'Commerce/OrdersTable.stx'), '<div>FRAMEWORK ORDERS</div>')
      await writeFile(path.join(framework, 'Commerce/ProductsTable.stx'), '<div>FRAMEWORK PRODUCTS</div>')

      const output = await render(root, '<OrdersTable /><ProductsTable />', {
        componentsDir: app,
        additionalComponentsDirs: [framework],
      })

      expect(output).toContain('APP ORDERS')
      expect(output).not.toContain('FRAMEWORK ORDERS')
      expect(output).toContain('FRAMEWORK PRODUCTS')
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('ranks above plugin and fallback directories that share a name', async () => {
    const root = createTempDir('stx-additional-')
    try {
      const app = path.join(root, 'app/components/Dashboard')
      const framework = path.join(root, 'framework/components/Dashboard')
      const plugin = path.join(root, 'node_modules/@stacksjs/components/src')
      await mkdir(app, { recursive: true })
      await mkdir(framework, { recursive: true })
      await mkdir(plugin, { recursive: true })

      await writeFile(path.join(framework, 'Button.stx'), '<div>FRAMEWORK BUTTON</div>')
      await writeFile(path.join(plugin, 'Button.stx'), '<div>PLUGIN BUTTON</div>')
      await writeFile(path.join(plugin, 'Sidebar.stx'), '<div>PLUGIN SIDEBAR</div>')

      const output = await render(root, '<Button /><Sidebar />', {
        componentsDir: app,
        additionalComponentsDirs: [framework],
        fallbackComponentsDir: plugin,
        _pluginComponentDirs: [plugin],
      })

      expect(output).toContain('FRAMEWORK BUTTON')
      expect(output).not.toContain('PLUGIN BUTTON')
      expect(output).toContain('PLUGIN SIDEBAR')
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  // The dashboard's real shape: the overridden component is rendered by a
  // sibling framework component, not by the page. A nested component resolves
  // beside its parent first, which found the framework's copy before the app's.
  it("lets the app override a component a framework component renders beside itself", async () => {
    const root = createTempDir('stx-additional-')
    try {
      const app = path.join(root, 'app/components/Dashboard')
      const framework = path.join(root, 'framework/components/Dashboard')
      await mkdir(path.join(app, 'Commerce'), { recursive: true })
      await mkdir(path.join(framework, 'Commerce'), { recursive: true })
      await mkdir(path.join(root, 'empty'), { recursive: true })

      await writeFile(path.join(framework, 'Commerce/OrdersDashboard.stx'), '<div>DASHBOARD <OrdersTable /></div>')
      await writeFile(path.join(framework, 'Commerce/OrdersTable.stx'), '<div>FRAMEWORK ORDERS</div>')
      await writeFile(path.join(app, 'Commerce/OrdersTable.stx'), '<div>APP ORDERS</div>')

      const overridden = await render(root, '<OrdersDashboard />', { componentsDir: app, additionalComponentsDirs: [framework] })
      expect(overridden).toContain('APP ORDERS')
      expect(overridden).not.toContain('FRAMEWORK ORDERS')

      // With nothing in the app's directory, the sibling still resolves.
      const plain = await render(root, '<OrdersDashboard />', { componentsDir: path.join(root, 'empty'), additionalComponentsDirs: [framework] })
      expect(plain).toContain('FRAMEWORK ORDERS')
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it("keeps an app component's own sibling ahead of the rest of the app's tree", async () => {
    const root = createTempDir('stx-additional-')
    try {
      const app = path.join(root, 'app/components')
      const framework = path.join(root, 'framework/components')
      await mkdir(path.join(app, 'Shop'), { recursive: true })
      await mkdir(path.join(app, 'Blog'), { recursive: true })
      await mkdir(framework, { recursive: true })

      await writeFile(path.join(app, 'Shop/Header.stx'), '<div>SHOP <Logo /></div>')
      await writeFile(path.join(app, 'Shop/Logo.stx'), '<b>SHOP LOGO</b>')
      await writeFile(path.join(app, 'Blog/Logo.stx'), '<b>BLOG LOGO</b>')

      const output = await render(root, '<Header />', { componentsDir: app, additionalComponentsDirs: [framework] })
      expect(output).toContain('SHOP LOGO')
      expect(output).not.toContain('BLOG LOGO')
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })

  it('searches the list in the order given', async () => {
    const root = createTempDir('stx-additional-')
    try {
      const first = path.join(root, 'first')
      const second = path.join(root, 'second')
      await mkdir(path.join(root, 'app'), { recursive: true })
      await mkdir(first, { recursive: true })
      await mkdir(second, { recursive: true })

      await writeFile(path.join(first, 'Card.stx'), '<div>FIRST CARD</div>')
      await writeFile(path.join(second, 'Card.stx'), '<div>SECOND CARD</div>')

      const output = await render(root, '<Card />', {
        componentsDir: path.join(root, 'app'),
        additionalComponentsDirs: [first, second],
      })

      expect(output).toContain('FIRST CARD')
      expect(output).not.toContain('SECOND CARD')
    }
    finally {
      await rm(root, { recursive: true, force: true })
    }
  })
})
