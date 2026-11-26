import { expect, it } from 'bun:test'
import { openBrowserPage } from './support/browser-page'

it('keeps long lists inside the active sidebar space scroll area', async () => {
  const items = Array.from({ length: 40 }, (_, index) => ({ id: `thread-${index}`, label: `Thread ${index}` }))
  const page = await openBrowserPage({
    name: 'sidebar-space-scroll',
    body: '<div style="height:320px"><Sidebar placement="static" :spaces="spaces" space="work" /></div>',
    context: { spaces: [{ id: 'work', label: 'Work', sections: [{ id: 'threads', label: 'Threads', items }] }] },
    ready: 'document.querySelectorAll(\'[data-space-active="true"] [data-sidebar-row]\').length === 40',
  })
  try {
    const size = await page.json(`
      const scroll = document.querySelector('[data-space-active="true"] .stx-sidebar-scroll');
      scroll.scrollTop = scroll.scrollHeight;
      const last = scroll.querySelector('[data-item-id="thread-39"]').getBoundingClientRect();
      const bounds = scroll.getBoundingClientRect();
      return { height: scroll.clientHeight, top: scroll.scrollTop, lastInside: last.bottom <= bounds.bottom };
    `)
    expect(size.height).toBeLessThanOrEqual(320)
    expect(size.top).toBeGreaterThan(0)
    expect(size.lastInside).toBe(true)
  }
  finally { page.close() }
}, 30_000)
