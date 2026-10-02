/**
 * `<ThemeToggle>` and `<EmptyState>`, the other two of #1981.
 *
 * ThemeToggle was hand-rolled in four of six apps: the same three states, the
 * same persistence, and the same pre-paint flash to avoid. That last part is
 * why it belongs in the library — and it is the part this component does NOT
 * reimplement. `useColorMode()` reads the options the pre-paint boot script
 * published on `window.__STX_COLOR_MODE__` (#1794), so the class already on
 * <html> before first paint and the key this reads are the same. A toggle that
 * picked its own key would undo the theme on hydration, which is the flash
 * arriving later rather than not at all.
 *
 * EmptyState was 29 hand-built copies across six apps. `Card` and `Button`
 * exist; the composition did not.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'
import { processDirectives } from '../../stx/src/process'
import { cleanupTestDirs, createPartialFile, PARTIALS_DIR, setupTestDirs } from '../../stx/test/utils'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

afterEach(() => {
  closeBrowser()
})

async function mountToggle(tag: string): Promise<{ scope: Record<string, any>, errors: string[], dispose: () => Promise<void> }> {
  const app = await renderApp({
    'layouts/app.stx': layout(''),
    'components/ThemeToggle.stx': readFileSync(path.join(UI, 'theme-toggle/ThemeToggle.stx'), 'utf-8'),
    'pages/index.stx': page('app', `<div id="host">${tag}</div>`),
  }, { '/': 'pages/index.stx' })
  const browser = await boot(app, '/')
  await settle()
  const scope = Object.values(browser.window.stx._scopes || {})
    .find((s: any) => typeof s?.cycle === 'function') as Record<string, any>
  if (!scope)
    throw new Error('theme toggle scope not registered')
  return { scope, errors: browser.errors, dispose: () => app.dispose() }
}

describe('#1981 — ThemeToggle drives the framework\'s colour mode', () => {
  it('offers the three states every hand-rolled copy had', async () => {
    const t = await mountToggle('<ThemeToggle />')
    try {
      t.scope.choose('dark')
      expect(t.scope.preference()).toBe('dark')
      expect(t.scope.isActive('dark')).toBe(true)

      t.scope.choose('light')
      expect(t.scope.preference()).toBe('light')

      // `system` is what people say and `auto` is what is stored; `set`
      // accepts either, and `isActive('system')` answers for the stored one.
      t.scope.choose('auto')
      expect(t.scope.preference()).toBe('auto')
      expect(t.scope.isActive('system')).toBe(true)
      expect(t.scope.isActive('light')).toBe(false)
    }
    finally {
      await t.dispose()
    }
  })

  it('cycles light, dark, system and round again', async () => {
    const t = await mountToggle('<ThemeToggle variant="button" />')
    try {
      t.scope.choose('light')
      const seen: string[] = []
      for (let i = 0; i < 4; i++) {
        t.scope.cycle()
        seen.push(t.scope.preference())
      }

      expect(seen).toEqual(['dark', 'auto', 'light', 'dark'])
    }
    finally {
      await t.dispose()
    }
  })

  /*
   * The resolved mode is what the page IS; the preference is what the user
   * asked for. `auto` means those differ, and a control showing the preference
   * while the page shows the mode is the only honest arrangement.
   */
  it('tracks the resolved mode separately from the preference', async () => {
    const t = await mountToggle('<ThemeToggle />')
    try {
      t.scope.choose('dark')

      expect(t.scope.preference()).toBe('dark')
      expect(['light', 'dark']).toContain(t.scope.resolved())
    }
    finally {
      await t.dispose()
    }
  })

  it('names the current theme for a screen reader on the icon-only variant', async () => {
    const t = await mountToggle('<ThemeToggle variant="button" />')
    try {
      t.scope.choose('dark')
      expect(t.scope.triggerLabel()).toContain('Dark')

      t.scope.choose('auto')
      expect(t.scope.triggerLabel()).toContain('System')
    }
    finally {
      await t.dispose()
    }
  })

  it('mounts clean, with no hydration complaints', async () => {
    const t = await mountToggle('<ThemeToggle />')
    try {
      expect(t.errors).toEqual([])
    }
    finally {
      await t.dispose()
    }
  })
})

/*
 * Server-rendered, because that is all EmptyState is: no client script, no
 * state, nothing to hydrate.
 */
describe('#1981 — EmptyState', () => {
  const opts = { debug: false, partialsDir: PARTIALS_DIR, componentsDir: PARTIALS_DIR } as never

  async function render(tag: string): Promise<string> {
    await setupTestDirs()
    await createPartialFile('EmptyState.stx', readFileSync(path.join(UI, 'empty-state/EmptyState.stx'), 'utf-8'))
    try {
      return await processDirectives(`<div>${tag}</div>`, {}, 'page.stx', opts, new Set())
    }
    finally {
      await cleanupTestDirs()
    }
  }

  it('renders the title, the description and the action slot', async () => {
    const html = await render('<EmptyState title="No monitors yet" description="Add one to start checking uptime."><button>Add monitor</button></EmptyState>')

    expect(html).toContain('No monitors yet')
    expect(html).toContain('Add one to start checking uptime.')
    expect(html).toContain('Add monitor')
    // A heading, not a styled div: this is the top of an empty region.
    expect(html).toMatch(/<h3[^>]*>\s*No monitors yet/)
  })

  /*
   * No icon, no circle. An empty state without one would otherwise carry a
   * floating grey disc, which is the kind of drift that makes 29 copies look
   * subtly different from each other.
   */
  it('draws no icon circle when given no icon', async () => {
    const html = await render('<EmptyState title="Nothing here" />')

    expect(html).not.toContain('rounded-full')
  })

  it('draws the circle around an icon it is given', async () => {
    const html = await render('<EmptyState title="Nothing here" icon="<svg id=\'i\'></svg>" />')

    expect(html).toContain('rounded-full')
    expect(html).toContain('<svg id=\'i\'>')
  })

  it('drops the panel when asked for bare', async () => {
    const panel = await render('<EmptyState title="x" />')
    const bare = await render('<EmptyState title="x" variant="bare" />')

    expect(panel).toContain('bg-panel')
    expect(bare).not.toContain('bg-panel')
  })

  it('takes its colours from roles, so a themed app reaches it', async () => {
    const html = await render('<EmptyState title="x" description="y" />')

    expect(html).toContain('text-fg')
    expect(html).toContain('text-fg-muted')
    expect(html).not.toMatch(/text-(?:gray|neutral)-\d{2,3}/)
  })
})
