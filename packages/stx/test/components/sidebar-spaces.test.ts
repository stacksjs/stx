import path from 'node:path'
import { describe, expect, it } from 'bun:test'
import {
  deriveSpaceTint,
  normalizeSpaces,
  resolveSpaceTint,
  spaceIndexOf,
} from '../../../components/src/ui/sidebar/spaces'
import { processDirectives } from '../../src/process'

/**
 * Arc-style sidebar spaces.
 *
 * A space is a whole sidebar at once — its own pinned tiles, its own rows, its
 * own color — and you swipe horizontally between them. Every space renders up
 * front on one track, so switching is a transform rather than a re-render:
 * that is what lets the next space track the finger at 1:1 and what lets each
 * space keep its own scroll position.
 *
 * These tests pin the parts of that contract a redesign could silently break:
 * the track geometry the gesture math depends on, the palette reaching the
 * pane server-side in both appearances, pinned tiles staying out of the row
 * model, and the controller taking its configuration from the DOM rather than
 * from values baked into a shared client bundle.
 */

const componentsDir = path.resolve(__dirname, '../../../components/src/ui/sidebar')
const pagePath = path.resolve(__dirname, '../../../components/examples/__test__.stx')

async function render(template: string): Promise<string> {
  return processDirectives(template, {}, pagePath, { componentsDir } as any, new Set<string>())
}

/** The pane's opening tag alone — page-wide assertions also hit the CSS. */
function pane(html: string): string {
  return html.match(/<aside[\s\S]*?>/)?.[0] || ''
}

/** The client script block containing `marker`, without its <script> tags. */
function clientScript(html: string, marker: string): string {
  const blocks = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || []
  return (blocks.find(block => block.includes(marker)) || '').replace(/<\/?script[^>]*>/gi, '')
}

const SPACES = `[
  { id: 'personal', label: 'Personal', icon: 'i-f7-house-fill', tint: 'green',
    pinned: [{ id: 'mail', label: 'Mail', icon: 'i-f7-envelope-fill' }],
    sections: [{ id: 'folders', items: [
      { id: 'routines', label: 'Routines', icon: 'i-f7-folder-fill', count: 2 },
    ] }],
    action: { label: 'New Note' },
    clear: { label: 'Clear' } },
  { id: 'dev', label: 'Development', icon: 'i-f7-star-fill', tint: 'blue',
    sections: [{ id: 'repos', items: [{ id: 'stacks', label: 'Stacks' }] }] },
]`

describe('sidebar spaces', () => {
  it('lays every space on one track, each panel a viewport wide', async () => {
    const result = await render(`<body><Sidebar placement="static" :spaces="${SPACES}" /></body>`)

    // Two spaces => a 200% track, so one panel is 50% of it. The controller
    // recomputes exactly this, so a mismatch here means the track jumps on
    // hydration.
    expect(result).toContain('width: 200%')
    expect(result).toContain('translate3d(-0%, 0, 0)')
    expect(result).toContain('data-space-viewport')
    expect((result.match(/data-space-id="/g) || []).length).toBeGreaterThanOrEqual(2)
    // Both spaces are in the DOM up front — that is the whole premise.
    expect(result).toContain('data-space-id="personal"')
    expect(result).toContain('data-space-id="dev"')
  })

  it('opens on the named space', async () => {
    const result = await render(`<body><Sidebar placement="static" space="dev" :spaces="${SPACES}" /></body>`)

    // Second of two panels: half the track.
    expect(result).toContain('translate3d(-50%, 0, 0)')
    expect(result).toContain('data-space-target="dev"')
  })

  it('defaults the theme to arc, since spaces are that theme\'s idea', async () => {
    const spaced = await render(`<body><Sidebar placement="static" :spaces="${SPACES}" /></body>`)
    expect(spaced).toContain('data-sidebar-theme="arc"')
    expect(pane(spaced)).toContain('data-sidebar-spaces="true"')

    // Without spaces the default is still the macOS source list. Asserted on
    // the pane rather than page-wide: the space CSS always ships in the
    // component's scoped <style>, only the attribute that activates it is
    // conditional.
    const plain = await render(`<body><Sidebar placement="static" :sections="[{ id: 's', items: [] }]" /></body>`)
    expect(plain).toContain('data-sidebar-theme="macos"')
    expect(pane(plain)).not.toContain('data-sidebar-spaces')
  })

  it('paints the pane with the active space palette, server-side, in both appearances', async () => {
    const result = await render(`<body><Sidebar placement="static" space="dev" :spaces="${SPACES}" /></body>`)

    // Both appearances ship together so CSS — not a client script — picks
    // between them; a dark-mode space is correct in the first paint.
    expect(result).toContain('--stx-space-light-from: color-mix(in oklab, #0088ff')
    expect(result).toContain('--stx-space-dark-from: color-mix(in oklab, #0088ff')
    expect(result).toContain('--stx-space-light-ink')
    expect(result).toContain('--stx-space-dark-accent')
    // The open space's color, not the first space's.
    expect(result).not.toContain('--stx-space-light-from: color-mix(in oklab, #34c759')

    // Registered so the panel crossfades on swipe. An unregistered custom
    // property is a token the browser cannot interpolate, so `transition` on
    // it would be a no-op.
    expect(result).toContain('@property --stx-space-from')
    expect(result).toContain('syntax: "<color>"')
  })

  it('renders a space\'s rows through the ordinary sidebar machinery', async () => {
    const result = await render(`<body><Sidebar placement="static" :spaces="${SPACES}" /></body>`)

    // Counts, icons and the row/item split are the Sidebar's, not a
    // reimplementation — that is why a space inherits disclosure, route
    // selection and keyboard navigation for free.
    expect(result).toContain('data-item-id="routines"')
    expect(result).toContain('data-sidebar-item')
    expect(result).toContain('>2<')
    // Space-level chrome.
    expect(result).toContain('New Note')
    expect(result).toContain('Clear')
  })

  it('keeps pinned tiles out of the row model', async () => {
    const result = await render(`<body><Sidebar placement="static" :spaces="${SPACES}" /></body>`)
    const tile = result.match(/<(?:a|button)[^>]*data-space-pinned-item[\s\S]*?<\/(?:a|button)>/)?.[0] || ''

    expect(tile).toContain('data-pinned-id="mail"')
    // A pinned tile is a shortcut, not a place in the list: carrying
    // `data-sidebar-item` would put it in the Sidebar controller's selection
    // and arrow-key navigation.
    expect(tile).not.toContain('data-sidebar-item')
    expect(tile).toContain('aria-label="Mail"')
  })

  it('marks the open space in the switcher rail', async () => {
    const result = await render(`<body><Sidebar placement="static" space="dev" :spaces="${SPACES}" showSpaceAdd /></body>`)

    expect(result).toMatch(/data-space-target="dev"[^>]*data-space-current="true"/)
    expect(result).toMatch(/data-space-target="personal"[^>]*data-space-current="false"/)
    expect(result).toContain('role="tablist"')
    expect(result).toContain('data-space-add')
  })

  it('hands the controller its configuration through the DOM, not the bundle', async () => {
    const result = await render(`<body><Sidebar placement="static" spacePersistKey="app.space" :spaces="${SPACES}" /></body>`)

    // Everything instance-specific rides on the element.
    expect(pane(result)).toContain('data-sidebar-spaces="true"')
    expect(result).toContain('data-space-config=')
    expect(result).toContain('app.space')

    // `<script client>` blocks are bundled and cached by content, so nothing
    // instance-specific may be baked into one: it would bust that cache on
    // every render or, once a bundle is reused, hand a second sidebar the
    // first one's spaces. The controller reads its config from the DOM and
    // finds its own root through the scope element, never by generated id.
    const script = clientScript(result, 'data-space-viewport')
    expect(script).toContain('__STX_CURRENT_ELEMENT__')
    expect(script).toContain('dataset.spaceConfig')
    expect(script).not.toContain('app.space')
    expect(script).not.toContain('getElementById')
  })
})

describe('space tints', () => {
  it('sends named colors and raw CSS colors down the same path', () => {
    // A macOS system color name resolves to its hex, then mixes identically to
    // a color passed directly — neither is a second-class citizen.
    expect(resolveSpaceTint('green')).toEqual(deriveSpaceTint('#34c759'))
    expect(resolveSpaceTint('#ff6b6b')).toEqual(deriveSpaceTint('#ff6b6b'))
    expect(resolveSpaceTint('oklch(70% 0.15 20)').light.from).toContain('oklch(70% 0.15 20)')
  })

  it('mixes in oklab so hues land at the same apparent lightness', () => {
    // sRGB mixing washes yellow out against blue at identical percentages;
    // oklab is what keeps a yellow space and a blue space reading as siblings.
    for (const seed of ['yellow', 'blue']) {
      const tint = resolveSpaceTint(seed)
      expect(tint.light.from).toContain('in oklab')
      expect(tint.dark.from).toContain('in oklab')
    }
  })

  it('passes a fully specified palette straight through', () => {
    const exact = {
      light: { from: '#fff', to: '#eee', ink: '#111', accent: '#f00' },
      dark: { from: '#111', to: '#000', ink: '#eee', accent: '#f88' },
    }
    expect(resolveSpaceTint(exact)).toBe(exact)
  })

  it('falls back to a neutral seed rather than to no color at all', () => {
    expect(resolveSpaceTint()).toEqual(deriveSpaceTint('#8e8e93'))
  })
})

describe('space normalization', () => {
  it('fills in action ids and icons so templates stay plain reads', () => {
    const [space] = normalizeSpaces([
      { id: 'personal', action: { label: 'New Note' }, clear: { label: 'Clear' } },
    ])

    expect(space.action).toEqual({ id: 'personal-action', label: 'New Note', icon: 'i-f7-plus' })
    expect(space.clear).toEqual({ id: 'personal-clear', label: 'Clear', icon: 'i-f7-arrow-down' })
    expect(space.pinned).toEqual([])
    expect(space.sections).toEqual([])
  })

  it('drops actions with no label instead of rendering an empty row', () => {
    const [space] = normalizeSpaces([{ id: 'a', action: { label: '' } }])
    expect(space.action).toBeNull()
    expect(space.clear).toBeNull()
  })

  it('is idempotent, so a space may be normalized more than once', () => {
    // `<Sidebar>` normalizes to pick the initial palette and `<SidebarSpaces>`
    // normalizes again to render; both must agree.
    const once = normalizeSpaces([{ id: 'a', tint: 'blue', action: { label: 'New' } }])
    expect(normalizeSpaces(once as any)).toEqual(once)
  })

  it('opens on the first space when the requested id is unknown', () => {
    const spaces = normalizeSpaces([{ id: 'a' }, { id: 'b' }])

    expect(spaceIndexOf(spaces, 'b')).toBe(1)
    // A stale persisted id or a typo must open on *something*, never on a
    // blank track scrolled past its own content.
    expect(spaceIndexOf(spaces, 'gone')).toBe(0)
    expect(spaceIndexOf(spaces)).toBe(0)
  })
})
