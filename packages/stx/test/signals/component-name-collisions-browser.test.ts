import { WebView } from 'bun'
import { expect, it } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import { createBrowserFixture, isolatedBrowserBackend } from '../../test-utils/browser-fixture'

it('keeps a component\'s names apart from the page\'s and from its siblings\'', async () => {
  const dir = createTempDir('stx-name-collisions-')
  let fixture: ReturnType<typeof createBrowserFixture> | undefined
  try {
    await Bun.write(join(dir, 'a-helpers.ts'), `export function fmt(n: number): string { return 'A' + n }\nexport const unit = 'a'\n`)
    await Bun.write(join(dir, 'b-helpers.ts'), `export function fmt(n: number): string { return 'B' + n }\nexport const unit = 'b'\n`)
    await Bun.write(join(dir, 'Counter.stx'), `<script client>
import { fmt, unit } from './a-helpers'
const count = state(10)
const label = state('counter')
function bump() { count.update(n => n + 1) }
</script>
<div data-counter><b data-count :text="fmt(count())"></b><u data-unit :text="unit"></u><i data-label :text="label()"></i><button data-bump @click="bump()">+</button></div>`)
    await Bun.write(join(dir, 'Other.stx'), `<script client>
import { fmt, unit } from './b-helpers'
const count = state(500)
const label = state('other')
function bump() { count.update(n => n + 5) }
</script>
<div data-other><b data-count :text="fmt(count())"></b><u data-unit :text="unit"></u><i data-label :text="label()"></i><button data-bump @click="bump()">+5</button></div>`)
    const html = await processDirectives(`<html><body><script client>
import { fmt } from './b-helpers'
const count = state(1)
const label = state('page')
function bump() { count.update(n => n + 100) }
</script><main>
<p data-page :text="label() + ':' + fmt(count())"></p><button data-page-bump @click="bump()">page</button>
<Counter /><Other /><Counter />
</main></body></html>`, {}, join(dir, 'page.stx'), { componentsDir: dir, autoShell: false } as never, new Set())
    fixture = createBrowserFixture({
      createServer: () => Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: () => new Response(html, { headers: { 'Content-Type': 'text/html' } }) }),
      createView: () => new WebView({ headless: true, backend: isolatedBrowserBackend() }),
      overallTimeoutMs: 25_000,
    })
    await fixture.view.navigate(fixture.url)
    const read = `JSON.stringify({ page: document.querySelector('[data-page]').textContent, counts: [...document.querySelectorAll('[data-count]')].map(n => n.textContent), units: [...document.querySelectorAll('[data-unit]')].map(n => n.textContent), labels: [...document.querySelectorAll('[data-label]')].map(n => n.textContent) })`
    await fixture.waitFor(`document.querySelectorAll('[data-count]').length === 3 && document.querySelector('[data-count]').textContent === 'A10'`, value => value === true)
    expect(JSON.parse(await fixture.view.evaluate(read))).toEqual({ page: 'page:B1', counts: ['A10', 'B500', 'A10'], units: ['a', 'b', 'a'], labels: ['counter', 'other', 'counter'] })

    await fixture.view.evaluate(`document.querySelectorAll('[data-bump]')[0].click()`)
    await fixture.view.evaluate(`document.querySelectorAll('[data-bump]')[1].click()`)
    await fixture.view.evaluate(`document.querySelector('[data-page-bump]').click()`)
    expect(JSON.parse(await fixture.view.evaluate(read))).toEqual({ page: 'page:B101', counts: ['A11', 'B505', 'A10'], units: ['a', 'b', 'a'], labels: ['counter', 'other', 'counter'] })
  }
  finally { fixture?.close(); rmSync(dir, { recursive: true, force: true }) }
}, 30_000)
