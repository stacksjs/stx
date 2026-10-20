import { afterEach, describe, expect, it } from 'bun:test'
import { boot, closeBrowser, layout, page, renderApp, settle } from '../router/spa-harness'
import { renderSlot } from '../../src/slots'
import { compileTemplate } from '../../src/template-compiler'
import { createTempDir } from '../../src/temp-dir'
import { rm } from 'node:fs/promises'
import path from 'node:path'

afterEach(closeBrowser)

describe('scoped slot interpolation (#2095)', () => {
  it('keeps unresolved expressions without losing resolved server props', async () => {
    const result = await renderSlot({
      name: 'cell',
      propsBinding: '{ row }',
      content: '{{ row.name }} / {{ callerSignal() }}',
    }, { row: { name: '<alpha>' } }, '', {})
    expect(result).toBe('&lt;alpha&gt; / {{ callerSignal() }}')
  })

  it('does not bake fallback or compound expressions against unavailable slot props', async () => {
    const content = '{{ row ? row.name : "empty" }} / {{ "row: " + row }}'
    expect(await renderSlot({ name: 'cell', propsBinding: '{ row }', content }, { row: undefined }, '', {
      row: { name: 'wrong server scope' },
    })).toBe(content)
    expect(await renderSlot({ name: 'cell', propsBinding: 'slotProps', content: '{{ "row: " + slotProps.row }}' },
      { row: undefined }, '', {})).toBe('{{ "row: " + slotProps.row }}')
  })

  it('preserves scoped and caller expressions through compileTemplate', async () => {
    const dir = createTempDir('stx-compile-slot-')
    try {
      await Bun.write(path.join(dir, 'components/Probe.stx'), `<script client>
const rows = state([{ name: 'alpha' }])
</script><div :for="row in rows()"><slot name="cell" :row="row" /></div>`)
      const file = path.join(dir, 'page.stx')
      await Bun.write(file, `<script client>
const callerSignal = state('caller')
</script><Probe><template #cell="{ row }">
<em>A:{{ row.name }}</em><em>B:{{ callerSignal() }}</em>
</template></Probe>`)
      const compiled = await compileTemplate(file, '/probe', { componentsDir: path.join(dir, 'components') })
      expect([...compiled.html.matchAll(/<em\b[^>]*>([\s\S]*?)<\/em>/g)].map(match => match[1])).toEqual([
        'A:{{ row.name }}',
        'B:{{ callerSignal() }}',
      ])
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  for (const callerScript of [false, true]) {
    it(`hydrates row text and updates it (caller script: ${callerScript})`, async () => {
      const app = await renderApp({
        'layouts/app.stx': layout(''),
        'components/Probe.stx': `<script client>
const rows = state([{ name: 'alpha' }])
window.__slotRows = rows
</script>
<div><template :for="row in rows()"><section>
<slot name="cell" :row="row" />
<span class="own">{{ row.name }}</span>
</section></template></div>`,
        'pages/probe.stx': page('app', `${callerScript ? `<script client>
const callerSignal = state('caller')
window.__slotCaller = callerSignal
</script>` : ''}
<Probe><template #cell="{ row }">
<em class="row">A:{{ row.name }}</em>
${callerScript ? '<em class="caller">B:{{ callerSignal() }}</em>' : ''}
<em class="attr" :title="row.name" x-text="row.name"></em>
</template></Probe>`),
      }, { '/probe': 'pages/probe.stx' })
      try {
        expect(app.documents.get('/probe')?.includes('A:{{ row.name }}')).toBe(true)
        const browser = await boot(app, '/probe')
        await settle()
        const text = (selector: string) => browser.document.querySelector(selector)?.textContent
        expect(text('.row')).toBe('A:alpha')
        expect(browser.document.querySelector('.row')?.closest('[x-cloak]')).toBeNull()
        expect(text('.own')).toBe('alpha')
        expect(text('.attr')).toBe('alpha')
        if (callerScript)
          expect(text('.caller')).toBe('B:caller')
        ;(browser.window as any).__slotRows.set([{ name: 'beta' }, { name: 'gamma' }])
        if (callerScript)
          (browser.window as any).__slotCaller.set('updated')
        await settle()
        expect([...browser.document.querySelectorAll('.row')].map(el => el.textContent)).toEqual(['A:beta', 'A:gamma'])
        expect(browser.document.querySelector('.row')?.closest('[x-cloak]')).toBeNull()
        if (callerScript)
          expect([...browser.document.querySelectorAll('.caller')].map(el => el.textContent)).toEqual(['B:updated', 'B:updated'])
      }
      finally {
        await app.dispose()
      }
    })
  }
})
