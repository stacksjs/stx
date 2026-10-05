/**
 * The bottom indicator (Dia-style dots).
 *
 * It used to be one icon button per space at 28px each, which fits about eight
 * in a 280px sidebar and then overflows. With every space showing the same
 * default folder glyph, thirteen of them read as a broken progress bar rather
 * than as a switcher. A dot says only "which of how many" and leaves the
 * identifying to the space title and the tint.
 *
 * Rendered through `<Sidebar>`, which is the only way these components are
 * used: the dots, the stylesheet and the controller all have to arrive on the
 * page together, and reading the three `.stx` files as text cannot tell you
 * whether any of them did.
 */
import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { attrValues, markup, renderSidebar } from './utils/render-sidebar'

function spaces(count: number): string {
  const names = ['Personal', 'Work', 'Side project', 'Archive']
  return `[${Array.from({ length: count }, (_, i) => `{ id: 's${i}', label: '${names[i % names.length]}', sections: [] }`).join(', ')}]`
}

async function sidebar(count: number): Promise<string> {
  return renderSidebar(`<body><Sidebar theme="arc" placement="static" :spaces="${spaces(count)}" /></body>`)
}

/** Every stylesheet the sidebar shipped with itself. */
function styles(html: string): string {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n')
}

/**
 * The declarations of every rule naming one class.
 *
 * Not `.class {`: the rendered stylesheet is scope-rewritten, so the selector
 * arrives as `[data-v-stx-85akly] .stx-space-dots, .stx-space-dots[data-v-stx-85akly]`
 * and a pattern anchored on the brace matches nothing. The lookahead is what
 * keeps `.stx-space-dot` from also answering for `.stx-space-dot-mark`.
 */
function declarations(sheet: string, className: string): string {
  const pattern = new RegExp(`\\.${className}(?![\\w-])[^{}]*\\{([^}]*)\\}`, 'g')
  return [...sheet.matchAll(pattern)].map(match => match[1]).join('\n')
}

/** The spaces controller, as it will reach the browser. */
function controller(html: string): string {
  const blocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1])
  return blocks.find(body => body.includes('revealCurrentDot')) ?? ''
}

describe('the indicator is dots, not an icon rail', () => {
  it('renders one dot per space, carrying no glyph', async () => {
    const html = markup(await sidebar(3))

    expect((html.match(/stx-space-dot-mark/g) ?? [])).toHaveLength(3)
    // The icon must not come back: it is what made thirteen spaces unreadable.
    expect(html).not.toMatch(/data-space-target[^>]*class="[^"]*\bi-/)
  })

  it('keeps each dot a real target while the mark stays small', async () => {
    // A 6px dot is not clickable. The button is the target; the mark is what
    // you see.
    const sheet = styles(await sidebar(3))

    expect(declarations(sheet, 'stx-space-dot')).toContain('width: 14px')
    expect(declarations(sheet, 'stx-space-dot-mark')).toContain('width: 6px')
  })

  it('hides itself for a single space', async () => {
    // One lonely dot indicates nothing. Dia hides the row entirely.
    expect(markup(await sidebar(1))).not.toContain('stx-space-dot-mark')
  })

  it('scrolls rather than shrinking when there are many spaces', async () => {
    // Dots that squeeze to fit stop reading as dots, and a sidebar cannot get
    // wider.
    const sheet = styles(await sidebar(4))

    expect(declarations(sheet, 'stx-space-dots')).toContain('overflow-x: auto')
    expect(declarations(sheet, 'stx-space-dot')).toContain('flex-shrink: 0')
  })

  it('labels every dot for screen readers and pointer users', async () => {
    // The dot carries no glyph, so the name has to come from somewhere.
    const html = markup(await sidebar(3))
    const dots = [...html.matchAll(/<button[^>]*data-space-target[^>]*>/g)].map(match => match[0])

    expect(dots).toHaveLength(3)
    for (const dot of dots) {
      expect(dot).toMatch(/aria-label="[^"]+"/)
      expect(dot).toMatch(/title="[^"]+"/)
      expect(dot).toContain('role="tab"')
    }
  })

  it('lights exactly one dot, server-side', async () => {
    // One source of truth: SidebarSpaces flips `data-space-current`, and the
    // first paint already has the right one lit.
    expect(attrValues(markup(await sidebar(3)), 'data-space-current')).toEqual(['true', 'false', 'false'])
  })

  it('wires no listener of its own', () => {
    // Source, deliberately: the rendered page carries one merged script, so
    // "the switcher does not bind its own handlers" is a statement about that
    // file and can only be made there.
    const switcher = readFileSync(join(import.meta.dir, '../src/ui/sidebar/SidebarSpaceSwitcher.stx'), 'utf8')

    expect(switcher).not.toContain('addEventListener')
  })

  it('centres the dots against the trailing button', async () => {
    // Without a matching gutter the dots sit off-centre by the width of "+".
    expect(markup(await sidebar(3))).toContain('stx-space-rail-gutter')
  })
})

describe('a space change is one motion', () => {
  it('publishes the settle timing as a custom property', async () => {
    // Four durations and three easings is what made a swipe read as several
    // things happening near each other.
    expect(await sidebar(3)).toContain('--stx-space-settle')
  })

  it('hardcodes no duration of its own for a space change', async () => {
    // Every one of these used to be a literal that could drift.
    expect(await sidebar(3)).not.toMatch(/--stx-space-(from|to|ink|accent)\s+\d+ms/)
  })

  it('routes the dots, the palette and the space panes through the token', async () => {
    const sheet = styles(await sidebar(3))

    expect((sheet.match(/var\(--stx-space-settle/g) ?? []).length).toBeGreaterThanOrEqual(3)
  })

  it('keeps hover quick, since it is not part of a space change', async () => {
    expect(styles(await sidebar(3))).toContain('transition-duration: 120ms')
  })

  it('still honours reduced motion', async () => {
    expect(styles(await sidebar(3))).toContain('prefers-reduced-motion')
  })
})

describe('the active dot stays visible', () => {
  it('scrolls the row to reveal it', async () => {
    // Measured on a sidebar with 22 spaces: the active one was the 20th and
    // none of the twelve you could see was lit, so the indicator indicated
    // nothing.
    expect(controller(await sidebar(3))).toContain('inline: "center"')
  })

  it('never scrolls the page vertically to do it', async () => {
    // A 6px dot must not drag the whole view around.
    expect(controller(await sidebar(3))).toContain('block: "nearest"')
  })

  it('does nothing when the row already fits', async () => {
    expect(controller(await sidebar(3))).toContain('row.scrollWidth <= row.clientWidth')
  })

  it('honours reduced motion through the existing helper', async () => {
    // `animates()` already exists; a second reduced-motion check would be one
    // more thing to keep in step.
    expect(controller(await sidebar(3))).toContain('behavior: animates() ? "smooth" : "auto"')
  })
})
