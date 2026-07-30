/**
 * Sidebar spaces — the data side of Arc's swipeable scenes.
 *
 * A *space* is a whole sidebar at once: its own pinned tiles, its own folders
 * and rows, its own bottom action, and — the part that carries the identity —
 * its own color. Arc stacks them side by side and you swipe horizontally to
 * move between them. `<SidebarSpaces>` renders that; this module owns
 * everything about a space that is data rather than markup.
 *
 * ## Color is derived, never enumerated
 *
 * A space carries one seed color and every surface is mixed from it:
 *
 *   from / to  the panel's gradient stops
 *   ink        the text color the whole space inherits
 *   accent     the saturated color for the selected switcher icon
 *
 * The mixing happens in CSS via `color-mix(in oklab, …)` rather than in
 * TypeScript, for three reasons. The browser interpolates in a perceptually
 * even space, so a yellow space and a blue space land at the same apparent
 * lightness instead of yellow washing out. `tint: 'blue'` (a macOS system
 * color) and `tint: '#ff6b6b'` (a brand color) go through the identical path,
 * so there is no second-class citizen. And because the output is a real
 * `<color>`, the registered custom properties in `Sidebar.stx` can *animate*
 * it — switching spaces crossfades the panel instead of cutting.
 *
 * ## Two palettes, one source
 *
 * Every tint resolves to a light and a dark set, and both are written to the
 * pane as inline custom properties (`--stx-space-light-*`, `--stx-space-dark-*`).
 * The scoped CSS picks between them under `prefers-color-scheme`. That split
 * matters: it keeps the appearance switch in CSS, so a space renders correctly
 * in dark mode on the *server*, before any client script runs.
 *
 * @module
 */

import type { SidebarSectionData } from './rows'
import { macosColors, type MacosColor } from './themes'

/** The four surfaces a space paints, in one appearance. */
export interface SidebarSpaceTintColors {
  /** Top stop of the panel gradient. */
  from: string
  /** Bottom stop of the panel gradient. */
  to: string
  /** Text color inherited by everything inside the space. */
  ink: string
  /** Saturated color for the active switcher icon and focus rings. */
  accent: string
}

/** A space's palette in both appearances. */
export interface SidebarSpaceTint {
  light: SidebarSpaceTintColors
  dark: SidebarSpaceTintColors
}

/** A tile in a space's pinned grid — Arc's favorites row. */
export interface SidebarPinnedItemData {
  id: string
  /** Accessible name. Shown as a tooltip, never as visible text. */
  label: string
  /** Iconify utility class, e.g. `i-f7-house-fill`. */
  icon?: string
  /** Favicon or artwork URL, rendered instead of an icon. */
  image?: string
  /** macOS system color name or any CSS color, applied to `icon`. */
  iconColor?: string
  href?: string
}

/** A single labelled action row (Arc's "+ New Tab", Notes' "+ New Note"). */
export interface SidebarSpaceActionData {
  /** Emitted back to the app. Defaults to the space id suffixed with the role. */
  id?: string
  label: string
  /** Iconify utility class. Defaults to a plus for the primary action. */
  icon?: string
}

/** One scene in a swipeable sidebar. */
export interface SidebarSpaceData {
  id: string
  /** Title shown above the rows, e.g. "Personal". */
  label?: string
  /** Iconify utility class — used for both the title and the switcher rail. */
  icon?: string
  /**
   * Seed color. A macOS system color name (`'blue'`, `'green'`, …), any CSS
   * color (`'#ff6b6b'`, `'oklch(70% 0.15 20)'`), or a fully specified
   * {@link SidebarSpaceTint} when you want exact control.
   */
  tint?: string | SidebarSpaceTint
  /** Favorites grid pinned above the rows. */
  pinned?: SidebarPinnedItemData[]
  /** Row groups, identical in shape to a plain `<Sidebar>`'s sections. */
  sections?: SidebarSectionData[]
  /** Primary action row at the foot of the list. */
  action?: SidebarSpaceActionData
  /** Small trailing action on the rule above `action` — Arc's "Clear". */
  clear?: SidebarSpaceActionData
}

/** Payload of the `spaceChange` event. */
export interface SidebarSpaceChangeEvent {
  id: string
  index: number
  /** What moved the sidebar — useful for telling a user gesture from a restore. */
  source: 'swipe' | 'switcher' | 'keyboard' | 'native' | 'restore' | 'api'
}

/** A space with its palette resolved and its inline custom properties built. */
export interface NormalizedSidebarSpace {
  id: string
  label: string
  icon: string
  pinned: SidebarPinnedItemData[]
  sections: SidebarSectionData[]
  action: SidebarSpaceActionData | null
  clear: SidebarSpaceActionData | null
  tint: SidebarSpaceTint
  /** `style` attribute value that publishes this space's palette. */
  style: string
}

/**
 * Neutral seed for spaces that declare no tint. Deliberately the macOS system
 * gray rather than a literal gray, so an untinted space sits in the same
 * perceptual family as the tinted ones instead of reading as "broken".
 */
const NEUTRAL_SEED = macosColors.gray

function mix(color: string, percent: number, into: string): string {
  return `color-mix(in oklab, ${color} ${percent}%, ${into})`
}

/**
 * Build a full light/dark palette from one seed color.
 *
 * The percentages are the tuning surface of the whole feature, so they are
 * worth stating plainly. In light appearance the panel stays *pale* — 16% and
 * 34% of the seed — because Arc's spaces are washes, not fills; anything
 * stronger and the white selection cards stop reading as raised. The ink is
 * the seed pulled almost to black (22% seed) so text keeps a hint of the
 * space's hue without losing contrast. In dark appearance the relationship
 * inverts: the seed is mixed *into* near-black for the panel and *into* white
 * for the ink and accent, which keeps a dark space recognizably the same color
 * as its light counterpart rather than a different one.
 */
export function deriveSpaceTint(seed: string): SidebarSpaceTint {
  return {
    light: {
      from: mix(seed, 16, '#ffffff'),
      to: mix(seed, 34, '#ffffff'),
      ink: mix(seed, 22, '#17171b'),
      accent: mix(seed, 88, '#2a2a30'),
    },
    dark: {
      from: mix(seed, 26, '#101014'),
      to: mix(seed, 14, '#08080b'),
      ink: mix(seed, 12, '#f4f4f7'),
      accent: mix(seed, 74, '#ffffff'),
    },
  }
}

/**
 * Resolve a space's `tint` prop to a palette.
 *
 * Accepts a macOS system color name, any CSS color, or a pre-built palette.
 * Unset falls back to the neutral seed.
 */
export function resolveSpaceTint(tint?: string | SidebarSpaceTint): SidebarSpaceTint {
  if (!tint)
    return deriveSpaceTint(NEUTRAL_SEED)
  if (typeof tint !== 'string')
    return tint
  return deriveSpaceTint(macosColors[tint as MacosColor] || tint)
}

/**
 * Render a palette as inline custom properties.
 *
 * Both appearances are published at once. `Sidebar.stx` maps them onto the
 * four registered properties it actually paints with, choosing per
 * `prefers-color-scheme`, so the correct appearance is already right in the
 * server-rendered HTML.
 */
export function spaceTintVars(tint: SidebarSpaceTint): string {
  return [
    `--stx-space-light-from: ${tint.light.from}`,
    `--stx-space-light-to: ${tint.light.to}`,
    `--stx-space-light-ink: ${tint.light.ink}`,
    `--stx-space-light-accent: ${tint.light.accent}`,
    `--stx-space-dark-from: ${tint.dark.from}`,
    `--stx-space-dark-to: ${tint.dark.to}`,
    `--stx-space-dark-ink: ${tint.dark.ink}`,
    `--stx-space-dark-accent: ${tint.dark.accent}`,
  ].join('; ')
}

function normalizeAction(
  action: SidebarSpaceActionData | undefined,
  spaceId: string,
  role: string,
  fallbackIcon: string,
): SidebarSpaceActionData | null {
  if (!action || !action.label)
    return null
  return {
    id: action.id || `${spaceId}-${role}`,
    label: action.label,
    icon: action.icon || fallbackIcon,
  }
}

/** Normalize one space so template bindings stay plain property reads. */
export function normalizeSpace(space: SidebarSpaceData): NormalizedSidebarSpace {
  const tint = resolveSpaceTint(space.tint)
  return {
    id: space.id,
    label: space.label || '',
    icon: space.icon || '',
    pinned: space.pinned || [],
    sections: space.sections || [],
    action: normalizeAction(space.action, space.id, 'action', 'i-f7-plus'),
    clear: normalizeAction(space.clear, space.id, 'clear', 'i-f7-arrow-down'),
    tint,
    style: spaceTintVars(tint),
  }
}

export function normalizeSpaces(spaces: SidebarSpaceData[]): NormalizedSidebarSpace[] {
  return (spaces || []).map(normalizeSpace)
}

/**
 * Index of `id` within `spaces`, or 0 when it is missing.
 *
 * Falling back to the first space rather than to -1 is deliberate: a stale
 * persisted id or a typo should open the sidebar on *something*, never on a
 * blank track scrolled past its own content.
 */
export function spaceIndexOf(spaces: NormalizedSidebarSpace[], id?: string): number {
  if (!id)
    return 0
  const index = spaces.findIndex(space => space.id === id)
  return index === -1 ? 0 : index
}

/**
 * The per-space palettes the client controller needs to repaint the pane.
 *
 * Only the colors travel — markup, sections and actions are already in the
 * DOM, so re-serializing them would just bloat the attribute.
 */
export function spaceTintPayload(spaces: NormalizedSidebarSpace[]): SidebarSpaceTint[] {
  return spaces.map(space => space.tint)
}
