import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { resolve } from 'node:path'
import { generateCss } from '../../stx/src/dev-server/ts-css'
import { compileClassStyles } from '../../stx/src/native/compiler/utilities-to-style'
import { sidebarThemes } from '../src/ui/sidebar/themes'
import { openBrowserPage } from './support/browser-page'
import { parse, renderSidebar } from './utils/render-sidebar'

const themes = ['default', ...Object.keys(sidebarThemes), 'unknown-theme']
const sections = `[
  { id: 'actions', label: 'Actions', items: [
    { id: 'link', label: 'Navigate', href: '/destination' },
    { id: 'action', label: 'Select' },
    { id: 'disabled', label: 'Disabled', href: '/disabled', disabled: true }
  ] }
]`

async function page() {
  return renderSidebar(`<!doctype html><html><head></head><body style="cursor:default">
    ${themes.map(theme => `<div data-cursor-fixture="${theme}">
      <Sidebar placement="static" ${theme === 'default' ? '' : `theme="${theme}"`} :sections="${sections}" />
      <SidebarSection label="Static label" collapsible="false" ${theme === 'default' ? '' : `theme="${theme}"`} />
    </div>`).join('\n')}
  </body></html>`)
}

it('sidebar links, action rows and collapsible headers advertise web interaction across themes', async () => {
  const html = await page()
  const css = await generateCss(html, resolve(import.meta.dir, '..'))
  const document = html.replace('</head>', `<style>${css}</style></head>`)
  const server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: () => new Response(document, { headers: { 'Content-Type': 'text/html' } }) })
  const view = new WebView({ headless: true, backend: { type: 'chrome', url: false } })
  try {
    await view.navigate(server.url.href)
    const snapshots = await view.evaluate(`Array.from(document.querySelectorAll('[data-cursor-fixture]'), fixture => {
      const cursor = selector => getComputedStyle(fixture.querySelector(selector)).cursor;
      const disabled = fixture.querySelector('[data-item-id="disabled"] [data-sidebar-item]');
      return {
        theme: fixture.dataset.cursorFixture,
        link: cursor('[data-item-id="link"] a'),
        action: cursor('[data-item-id="action"] button'),
        disabled: getComputedStyle(disabled).cursor,
        disabledButton: disabled.tagName === 'BUTTON' && disabled.disabled && disabled.getAttribute('aria-disabled') === 'true',
        header: cursor('[data-sidebar-section-header]'),
        staticHeader: getComputedStyle(Array.from(fixture.querySelectorAll('section')).at(-1).firstElementChild).cursor,
        href: fixture.querySelector('[data-item-id="link"] a').getAttribute('href')
      };
    })`) as Array<Record<string, unknown>>
    expect(snapshots).toHaveLength(themes.length)
    for (const snapshot of snapshots) {
      expect(snapshot, String(snapshot.theme)).toMatchObject({ link: 'pointer', action: 'pointer', header: 'pointer', disabled: 'default', disabledButton: true, staticHeader: 'default', href: '/destination' })
    }
  }
  finally { view.close(); server.stop(true) }
}, 30_000)

it('collapsed sections remove their rows from keyboard focus and restore focusability when expanded', async () => {
  const page = await openBrowserPage({
    name: 'sidebar-section-focus',
    body: `<Sidebar placement="static" :sections="${sections}" />`,
    ready: `(() => {
      const header = document.querySelector('[data-sidebar-section-header]');
      if (!header) return false;
      if (header.getAttribute('aria-expanded') === 'true') header.click();
      return header.getAttribute('aria-expanded') === 'false';
    })()`,
  })
  try {
    const state = await page.json(`
      const header = document.querySelector('[data-sidebar-section-header]');
      const row = document.querySelector('[data-item-id="link"]');
      const link = row.querySelector('a');
      header.focus();
      link.focus();
      const collapsed = row.inert && document.activeElement === header;
      header.click();
      link.focus();
      return { collapsed, expanded: !row.inert && document.activeElement === link };
    `)
    expect(state).toEqual({ collapsed: true, expanded: true })
  }
  finally { page.close() }
}, 30_000)

it('sidebar cursor cues leave native styles and diagnostics unchanged for touch and pointer hosts', async () => {
  const document = parse(await page())
  const nodes = [...document.querySelectorAll('[data-sidebar-item], [data-sidebar-section-header]')]
  expect(nodes.length).toBeGreaterThan(themes.length)
  for (const node of nodes) {
    const classes = node.getAttribute('class') || ''
    const withoutCursor = classes.split(/\s+/).filter(name => !name.startsWith('cursor-')).join(' ')
    for (const pointer of [false, true]) {
      expect(compileClassStyles(classes, undefined, { pointer })).toEqual(compileClassStyles(withoutCursor, undefined, { pointer }))
    }
  }
})
