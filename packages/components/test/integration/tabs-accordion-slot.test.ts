/**
 * Integration tests for #1703: Tabs and Accordion gained a slot-based API
 * alongside the legacy prop-array API. The legacy snapshots should continue
 * to render; the new mode should produce the data-attribute markers that
 * the parent components rely on at runtime.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const UI_DIR = join(__dirname, '..', '..', 'src', 'ui')
const TABS_SRC = readFileSync(join(UI_DIR, 'tabs/Tabs.stx'), 'utf8')
const TAB_PANEL_SRC = readFileSync(join(UI_DIR, 'tabs/TabPanel.stx'), 'utf8')
const ACCORDION_SRC = readFileSync(join(UI_DIR, 'accordion/Accordion.stx'), 'utf8')
const ACCORDION_ITEM_SRC = readFileSync(join(UI_DIR, 'accordion/AccordionItem.stx'), 'utf8')

describe('#1703 — Tabs slot API', () => {
  it('TabPanel renders the discovery markers the parent needs', () => {
    // Parent walks [data-stx-tab-panel] descendants and reads data-label /
    // data-icon to build the tab list dynamically.
    expect(TAB_PANEL_SRC).toContain('data-stx-tab-panel')
    expect(TAB_PANEL_SRC).toContain('data-label="{{ label }}"')
    expect(TAB_PANEL_SRC).toContain('data-icon="{{ icon }}"')
    // Hidden by default — Tabs flips the active one visible after mount.
    expect(TAB_PANEL_SRC).toMatch(/\bhidden\b/)
    // Slot content is rendered inside the panel.
    expect(TAB_PANEL_SRC).toContain('<slot />')
    // Accessibility: each panel is a tabpanel.
    expect(TAB_PANEL_SRC).toContain('role="tabpanel"')
  })

  it('Tabs has both legacy prop mode and slot mode', () => {
    // Legacy path: @foreach over the prop array preserved verbatim so the
    // existing visual snapshots stay byte-identical.
    expect(TABS_SRC).toContain('@foreach(tab in tabs)')
    expect(TABS_SRC).toContain('{!! tab.content !!}')
    // Slot path: dynamic tab list driven by discoveredTabs() state
    expect(TABS_SRC).toContain('discoveredTabs')
    expect(TABS_SRC).toContain('hasPropTabs')
    expect(TABS_SRC).toContain('[data-stx-tab-panel]')
    // Container marker so parents can scope queries to "own" panels and
    // skip panels from a nested <Tabs>.
    expect(TABS_SRC).toContain('data-stx-tabs')
  })

  it('Tabs picks slot mode when the tabs prop is empty', () => {
    // hasPropTabs is derived server-side from Array.isArray(tabs) && tabs.length > 0
    expect(TABS_SRC).toMatch(/hasPropTabs\s*=\s*Array\.isArray\(tabs\)\s*&&\s*tabs\.length\s*>\s*0/)
    // Slot rendered only when prop mode is off
    expect(TABS_SRC).toMatch(/@if\(hasPropTabs\)[\s\S]*?@else[\s\S]*?<slot \/>[\s\S]*?@endif/)
  })

  it('Tabs nested scoping: closest() guards filter own panels only', () => {
    // Without this, a <Tabs> with a <Tabs> inside one of its panels would
    // claim the nested Tabs' panels as its own.
    expect(TABS_SRC).toContain("p.closest('[data-stx-tabs]') === root")
  })
})

describe('#1703 — Accordion slot API', () => {
  it('AccordionItem renders header + content panel with discovery markers', () => {
    expect(ACCORDION_ITEM_SRC).toContain('data-stx-accordion-item')
    expect(ACCORDION_ITEM_SRC).toContain('data-title="{{ title }}"')
    // Each item renders its own header so the open/close UI sits next to
    // its content (interleaved, not all-headers-then-all-content).
    expect(ACCORDION_ITEM_SRC).toContain('data-stx-accordion-header')
    expect(ACCORDION_ITEM_SRC).toContain('data-stx-accordion-content')
    // Content panel starts hidden; Accordion's effect un-hides it when open.
    expect(ACCORDION_ITEM_SRC).toMatch(/data-stx-accordion-content[^>]*hidden/)
    // Chevron icon marker — Accordion rotates this on open.
    expect(ACCORDION_ITEM_SRC).toContain('data-stx-accordion-chevron')
    expect(ACCORDION_ITEM_SRC).toContain('<slot />')
  })

  it('Accordion has both legacy items prop mode and slot mode', () => {
    expect(ACCORDION_SRC).toContain('@foreach(item in items)')
    expect(ACCORDION_SRC).toContain('{!! item.content !!}')
    expect(ACCORDION_SRC).toContain('hasPropItems')
    expect(ACCORDION_SRC).toContain('data-stx-accordion')
    expect(ACCORDION_SRC).toContain('[data-stx-accordion-item]')
  })

  it('Accordion wires click + keydown handlers to AccordionItem headers', () => {
    // findOwnItems() + per-item header.addEventListener('click', ...) +
    // header.addEventListener('keydown', ...) is how the parent activates
    // the discovered children.
    expect(ACCORDION_SRC).toContain('findOwnItems')
    expect(ACCORDION_SRC).toMatch(/header\.addEventListener\(['"]click['"]/)
    expect(ACCORDION_SRC).toMatch(/header\.addEventListener\(['"]keydown['"]/)
    // Idempotency guard so HMR re-runs don't double-bind.
    expect(ACCORDION_SRC).toContain('__stx_wired')
  })

  it('Accordion respects allowMultiple in toggle logic', () => {
    // Multi: toggles membership; single: replaces with single-element array.
    expect(ACCORDION_SRC).toMatch(/cur\.includes\(index\)\s*\?\s*cur\.filter\(/)
    expect(ACCORDION_SRC).toMatch(/cur\.includes\(index\)\s*\?\s*\[\]\s*:\s*\[index\]/)
  })

  it('Accordion syncs aria-expanded + chevron rotation as openItems changes', () => {
    expect(ACCORDION_SRC).toContain("setAttribute('aria-expanded'")
    expect(ACCORDION_SRC).toMatch(/transform = `rotate\(\$\{isOpenItem \? 180 : 0\}deg\)`/)
  })
})

describe('#1703 — exports and type interfaces', () => {
  it('tabs/index.ts re-exports TabPanel and types both APIs', () => {
    const src = readFileSync(join(UI_DIR, 'tabs/index.ts'), 'utf8')
    expect(src).toContain("export { default as TabPanel } from './TabPanel.stx'")
    expect(src).toContain('export interface TabPanelProps')
    // Legacy `tabs` prop is now optional (was required) since slot mode is valid
    expect(src).toMatch(/tabs\?:\s*Tab\[\]/)
  })

  it('accordion/index.ts re-exports AccordionItem and types both APIs', () => {
    const src = readFileSync(join(UI_DIR, 'accordion/index.ts'), 'utf8')
    expect(src).toContain("export { default as AccordionItem } from './AccordionItem.stx'")
    expect(src).toContain('export interface AccordionItemProps')
    expect(src).toMatch(/items\?:\s*AccordionItem\[\]/)
  })
})
