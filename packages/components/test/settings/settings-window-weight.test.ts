/**
 * What a settings page weighs as it grows (stacksjs/stx#2219).
 *
 * Postline's settings page was 644 KB, 383 KB of it inline style: every row,
 * switch and field brought its component's stylesheet again. A window of 6
 * panes of 6 rows shipped 727 KB of style for 72 KB of CSS. What a page holds
 * per component should be paid once, whatever the number of rows.
 *
 * Scripts the same: each row's script had its label and ids written into it,
 * so no two were alike and none shared a factory (7 KB a row). The values are
 * passed to one shared factory per component now, a few hundred bytes a row.
 */
import { describe, expect, it } from 'bun:test'
import { resolve } from 'node:path'
import { processDirectives } from '../../../stx/src/process'

const ROOT = resolve(import.meta.dir, '../..')

function settingsPage(panes: number, rows: number): string {
  const row = (p: number, r: number) => [
    `<SettingsRow label="Switch ${p}-${r}" setting="s${p}-${r}"><Switch variant="mac" v-model:checked="flag" /></SettingsRow>`,
    `<SettingsRow label="Select ${p}-${r}"><Select variant="mac" v-model:value="size" placeholder="" :options="['small', 'medium', 'large']" /></SettingsRow>`,
    `<SettingsRow label="Text ${p}-${r}"><TextInput variant="mac" v-model:value="name" /></SettingsRow>`,
  ][r % 3]
  return `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script client>
const pane = state('p0')
const flag = state(true)
const size = state('medium')
const name = state('x')
</script>
<SettingsWindow title="Settings" storageKey="weight" v-model:pane="pane">
  <template #sidebar><SettingsSidebarGroup>${Array.from({ length: panes }, (_, p) => `<SettingsSidebarItem id="p${p}" label="Pane ${p}" tone="grey" />`).join('')}</SettingsSidebarGroup></template>
${Array.from({ length: panes }, (_, p) => `<SettingsPane id="p${p}" title="Pane ${p}"${p === 0 ? ' active' : ''}><SettingsGroup header="Group">${Array.from({ length: rows }, (_, r) => row(p, r)).join('')}</SettingsGroup></SettingsPane>`).join('\n')}
</SettingsWindow>
</body></html>`
}

async function render(panes: number, rows: number): Promise<string> {
  return processDirectives(settingsPage(panes, rows), {}, resolve(ROOT, `settings-weight-${panes}x${rows}.stx`), { componentsDir: resolve(ROOT, 'src/ui'), root: ROOT, cache: false, debug: false } as any, new Set())
}

const scriptBytes = (html: string) => [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].reduce((sum, match) => sum + match[0].length, 0)
const styleBytes = (html: string) => [...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].reduce((sum, match) => sum + match[0].length, 0)

describe('a settings page as it grows', () => {
  it('carries each component\'s stylesheet once, however many rows use it', async () => {
    const small = await render(1, 3)
    const large = await render(6, 6)
    // The same components, so the same CSS: one copy each.
    expect(styleBytes(large)).toBe(styleBytes(small))
    const styles = [...large.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/g)].map(match => match[0])
    expect(new Set(styles).size).toBe(styles.length)
  }, 60_000)

  it('adds little script per row: one factory per component, called with each row\'s values', async () => {
    const small = await render(1, 3)
    const large = await render(6, 6)
    const perRow = (scriptBytes(large) - scriptBytes(small)) / (36 - 3)
    // About 0.8 KB with a sidebar item and a pane per six rows; it was 8 KB.
    expect(perRow).toBeLessThan(2000)
    // The rows' labels reach them as values, not in a script of their own.
    expect(large).toContain('/*stx-values*/')
    expect(large).not.toMatch(/useReactiveProp\(["']label["'], ["']Switch 0-0["']\)/)
  }, 60_000)
})
