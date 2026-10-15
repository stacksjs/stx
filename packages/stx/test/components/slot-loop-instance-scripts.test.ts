/**
 * A component in a `:for` inside slot content keeps its setup script in the
 * loop row.
 *
 * Slot content hoists the caller's client scripts out to the end of the
 * expanded component, so the caller's page compiles them in its own scope.
 * That pass also swept up the setup script of every component already
 * expanded inside the slot. For one inside a `:for`, the script left the row:
 * the runtime clones a row with its script and runs that script for each
 * clone, so once an `:if` mounted the slot host every clone came up with no
 * setup and showed its raw `:class` and `{{ }}`. Found in hq.training, where
 * pictures in a strength editor inside a dialog drew blank.
 */
import { describe, expect, it } from 'bun:test'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'

function project(files: Record<string, string>): string {
  const dir = createTempDir('stx-slot-loop-')
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true })
    writeFileSync(path.join(dir, file), content)
  }
  return dir
}

const dir = project({
  'components/SlotLeaf.stx': `<script client>\nconst leafOn = state('on')\n</script>\n<span data-leaf :class="leafOn">leaf</span>\n`,
  'components/SlotWrap.stx': `<script client>\nconst wrapItems = state([1, 2])\n</script>\n<div data-wrap><span :for="item in wrapItems" :key="item"><SlotLeaf /></span></div>\n`,
  'components/SlotHost.stx': `<div data-host><slot /></div>\n`,
})

function render(page: string): Promise<string> {
  return processDirectives(page, {}, path.join(dir, 'page.stx'), { componentsDir: path.join(dir, 'components'), root: dir, buildMode: 'serve' }, new Set<string>())
}

/** The markup of the `:for` row, from its opening tag to its closing `</span>`. */
function loopRow(html: string): string {
  const start = html.indexOf('<span :for="item in wrapItems"')
  expect(start).toBeGreaterThan(-1)
  return html.slice(start, html.indexOf('</span></div>', start))
}

describe('component scripts in a loop inside a slot', () => {
  it('stay in the row, as they do without the slot', async () => {
    for (const page of ['<SlotWrap />', '<SlotHost><SlotWrap /></SlotHost>']) {
      const html = await render(page)
      const leaf = /<span data-stx-scope="(stx_slot_leaf_[^"]+)" data-leaf/.exec(html)?.[1]
      expect(leaf, page).toBeTruthy()
      expect(loopRow(html), page).toContain(`data-stx-owner="${leaf}"`)
    }
  })

  it('still hoists a script the caller wrote in the slot', async () => {
    const html = await render('<SlotHost><p data-caller>{{ callerNote }}</p>\n<script client>\nconst callerNote = state(\'hi\')\n</script></SlotHost>')
    const host = html.indexOf('<div data-host>')
    const hostEnd = html.indexOf('</div>', host)
    const caller = html.indexOf('callerNote = state')
    expect(caller).toBeGreaterThan(hostEnd)
  })
})
