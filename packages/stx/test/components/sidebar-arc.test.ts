import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import { resolveSidebarTheme } from '../../../components/src/ui/sidebar/themes'
import { processDirectives } from '../../src/process'

/**
 * The `arc` sidebar theme — a recreation of the Arc browser's sidebar.
 *
 * Arc inverts the macOS selection model. AppKit fills the selected row with
 * the system accent and turns its label white; Arc *raises* the row into a
 * white card floating on a warm tinted panel. That inversion is the whole
 * look, so `arc` uses the `classes` selection model (the card lives in
 * `item.active`) rather than the `accent` model, whose scoped CSS would paint
 * an accent fill over it.
 *
 * These tests pin the parts of that contract a redesign could silently break:
 * the selection is a card and not a fill, the panel is warm rather than the
 * macOS neutral, rows are discrete instead of contiguous, and the macOS-only
 * chrome does not leak in.
 */

const componentsDir = path.resolve(__dirname, '../../../components/src/ui/sidebar')
const pagePath = path.resolve(__dirname, '../../../components/examples/__test__.stx')

async function render(template: string): Promise<string> {
  return processDirectives(template, {}, pagePath, { componentsDir } as any, new Set<string>())
}

const SECTIONS = `[
  { id: 'pinned', label: 'Pinned', items: [
    { id: 'calendar', label: 'Calendar sync', icon: 'i-f7-folder', active: true },
    { id: 'seo', label: 'Landing & SEO', icon: 'i-f7-folder', count: 3 },
  ] },
]`

describe('arc sidebar theme', () => {
  it('renders through the shared Sidebar with the classes selection model', async () => {
    const result = await render(`<body><Sidebar theme="arc" placement="static" :sections="${SECTIONS}" /></body>`)

    expect(result).toContain('data-sidebar-theme="arc"')
    // `accent` here would let the macOS scoped CSS repaint the row and defeat
    // the card entirely — the two models are mutually exclusive.
    expect(result).toContain('data-sidebar-selection="classes"')
    expect(result).toContain('data-item-id="calendar"')
    expect(result).toContain('data-item-id="seo"')
    expect(result).toContain('>3<')
  })

  it('paints the selected row as a raised white card, not an accent fill', async () => {
    const theme = resolveSidebarTheme('arc')

    // The signature: white fill + hairline + a single-pixel drop shadow.
    expect(theme.item.active).toContain('bg-white')
    expect(theme.item.active).toMatch(/shadow-\[0_1px_2px/)
    expect(theme.item.active).toMatch(/ring-1/)
    // Arc keeps the weight shift subtle — the card carries the emphasis.
    expect(theme.item.active).toContain('font-medium')
    expect(theme.item.active).not.toContain('font-semibold')

    // And the card actually reaches the DOM, since `classes` selection is the
    // only thing that puts it there.
    const result = await render(`<body><Sidebar theme="arc" placement="static" :sections="${SECTIONS}" /></body>`)
    expect(result).toContain('data-active="true"')
    expect(result).toMatch(/shadow-\[0_1px_2px/)
  })

  it('uses a warm panel with an overridable space tint', async () => {
    const result = await render(`<body><Sidebar theme="arc" placement="static" :sections="${SECTIONS}" /></body>`)

    // Warm off-white, not the macOS neutral #f2f2f4 — the warmth is what makes
    // it read as Arc at a glance.
    expect(result).toContain('#f7f5f1')
    expect(result).not.toContain('#f2f2f4')
    // Apps color the panel per space by setting this custom property; unset it
    // resolves to the warm default baked into the gradient.
    expect(result).toContain('--stx-sidebar-tint')
  })

  it('spaces rows apart instead of running them together like AppKit', () => {
    const arc = resolveSidebarTheme('arc')
    const macos = resolveSidebarTheme('macos')

    // Arc rows are discrete cards, so consecutive selections must not merge
    // into one block the way a macOS source list deliberately does.
    expect(arc.sectionGroup).toContain('space-y-[2px]')
    expect(macos.sectionGroup).not.toContain('space-y')
    expect(arc.item.base).toContain('h-[30px]')
  })

  it('does not leak macOS-only chrome', async () => {
    const result = await render(`<body><Sidebar theme="arc" placement="static" :sections="${SECTIONS}" /></body>`)

    // The Liquid Glass shimmer rim belongs to the macOS material; Arc's panel
    // is flat and warm, so the rim ELEMENT must not render. (Its CSS always
    // ships in the component's scoped <style> — only the layer is conditional,
    // so assert on the element, not the class name appearing anywhere.)
    expect(result).not.toContain('class="stx-sidebar-rim"')
    expect(resolveSidebarTheme('arc').layers.shimmerRim).toBeUndefined()

    // macOS renders it, which is what makes the absence above meaningful.
    const macosResult = await render(`<body><Sidebar theme="macos" placement="static" :sections="${SECTIONS}" /></body>`)
    expect(macosResult).toContain('class="stx-sidebar-rim"')
  })

  it('leaves the other themes untouched', () => {
    // Registering a theme must not perturb the existing ones, and an unknown
    // name still falls back to macOS.
    expect(resolveSidebarTheme('macos').selection).toBe('accent')
    expect(resolveSidebarTheme('arc').selection).toBe('classes')
    expect(resolveSidebarTheme('nope')).toBe(resolveSidebarTheme('macos'))
    expect(resolveSidebarTheme('tahoe')).toBe(resolveSidebarTheme('macos'))
  })
})
