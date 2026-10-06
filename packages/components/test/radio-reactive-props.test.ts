/**
 * Radio's label, description and value follow the parent's bindings.
 *
 * They were read once on the server, which is enough for a literal:
 *
 *     <Radio label="Fast" value="fast" />
 *
 * but the ordinary way to render a set of options is a client `:for` over a
 * list the page owns, and there every prop is a binding the server never saw:
 *
 *     <Radio :for="option in options" :label="option.label" :value="option.value" />
 *
 * Each radio shipped with no label, no description and `value=""`. A settings
 * page showed four bare circles that all submitted the same empty value.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, find, layout, page, renderApp, settle } from '../../stx/test/router/spa-harness'

const UI = path.join(import.meta.dir, '..', 'src', 'ui')

function component(rel: string): string {
  return readFileSync(path.join(UI, rel), 'utf-8')
}

const HOST = `<script client>
  const options = state([
    { label: 'Fast oxidiser', description: 'Burns carbohydrate quickly', value: 'fast' },
    { label: 'Slow oxidiser', description: 'Burns fat steadily', value: 'slow' },
  ])
</script>

<div id="host">
  <div :for="option in options" :key="option.value" class="option">
    <Radio name="profile" :label="option.label" :description="option.description" :value="option.value" />
  </div>
  <div class="literal">
    <Radio name="literal" label="Static" value="static" />
  </div>
</div>`

const FILES = {
  'layouts/app.stx': layout(''),
  'components/Radio.stx': component('radio/Radio.stx'),
  'components/Host.stx': HOST,
  'pages/index.stx': page('app', '<Host />'),
}

afterEach(() => {
  closeBrowser()
})

describe('Radio reads label, description and value as live props', () => {
  it('labels each radio rendered from a client list', async () => {
    const app = await renderApp(FILES, { '/': 'pages/index.stx' })
    try {
      const browser = await boot(app, '/')
      await settle()
      const options = [...browser.window.document.querySelectorAll('.option')] as any[]
      expect(options).toHaveLength(2)
      expect(options[0].querySelector('label')?.textContent).toContain('Fast oxidiser')
      expect(options[0].querySelector('p')?.textContent).toContain('Burns carbohydrate quickly')
      expect(options[0].querySelector('input').value).toBe('fast')
      expect(options[1].querySelector('label')?.textContent).toContain('Slow oxidiser')
      expect(options[1].querySelector('input').value).toBe('slow')
    }
    finally {
      await app.dispose()
    }
  })

  it('still renders a literal label on the server', async () => {
    const app = await renderApp(FILES, { '/': 'pages/index.stx' })
    try {
      const browser = await boot(app, '/')
      await settle()
      const literal = find(browser, '.literal')
      expect(literal.querySelector('label')?.textContent).toContain('Static')
      expect(literal.querySelector('input').getAttribute('value')).toBe('static')
    }
    finally {
      await app.dispose()
    }
  })
})
