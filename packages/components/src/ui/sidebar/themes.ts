/**
 * Sidebar theme registry
 *
 * Every visual decision the sidebar makes lives here, expressed as utility
 * classes, so a theme can be read top-to-bottom like a spec sheet.
 *
 * The flagship theme is `macos` — a faithful recreation of the sidebar in
 * the latest macOS (Tahoe, macOS 26/27 "Liquid Glass"). Its metrics were
 * measured pixel-by-pixel from Mail.app's source list at @2x:
 *
 *   row pitch 32px, and the highlight fills the whole 32px — AppKit leaves
 *     no gap between rows, so consecutive selected/hovered rows touch
 *   highlight radius 8px
 *   label 13px · count 13px secondary gray · section header 11px semibold,
 *     Title Case (NOT uppercase — uppercasing section headers is the single
 *     most common tell of a web sidebar imitating macOS)
 *   icon 17px in a fixed 22px slot · disclosure gutter 18px · child indent 16px
 *   pane 234px wide, #f1f2f3 in light appearance, ~90% opaque so the
 *     backdrop bleeds through faintly rather than tinting the pane
 *
 * Selection follows AppKit's two-state model (`selection` below): in a key
 * window the row takes the system accent with a white label, icon and count;
 * when the window resigns key it falls back to a neutral fill with the label
 * left dark. Icons desaturate to gray in the same non-key state.
 *
 * The other first-class theme is `arc`, a recreation of the Arc browser's
 * sidebar. It inverts the macOS selection model — a raised white card on a
 * warm tinted panel instead of an accent fill on gray — so it uses the
 * `classes` selection model rather than `accent`. See its own block below.
 *
 * Legacy themes (`workspace`, `desktop`, `solid`, `transparent`, `vibrancy`)
 * are preserved verbatim from the previous variant maps. `tahoe` now aliases
 * `macos` — it always meant "look like macOS", and now it actually does.
 */

/** macOS system colors (light appearance) for tinting sidebar icons. */
export const macosColors = {
  blue: '#0088ff',
  red: '#ff383c',
  pink: '#ff2d55',
  orange: '#ff8d28',
  yellow: '#ffcc00',
  green: '#34c759',
  teal: '#00c3d0',
  cyan: '#00c0e8',
  indigo: '#6155f5',
  purple: '#cb30e0',
  brown: '#ac7f5e',
  gray: '#8e8e93',
} as const

export type MacosColor = keyof typeof macosColors

/**
 * How a theme paints the selected row.
 *
 * `accent` reproduces AppKit: the pane owns CSS custom properties for the
 * key/non-key fills, and scoped rules recolor the row's label, icon, count
 * and chevron together. `classes` is the older utility-class model, where
 * `item.active` is simply added to the row element and children are left
 * alone. Legacy themes stay on `classes` so they render exactly as before.
 */
export type SidebarSelectionModel = 'accent' | 'classes'

/** Class groups a sidebar theme provides. All values are utility classes. */
export interface SidebarTheme {
  /** The <aside> pane itself: material, text color, borders. */
  pane: string
  /** Which selection model the Sidebar controller and scoped CSS apply. */
  selection: SidebarSelectionModel
  /** Extra overlay layers rendered inside the pane (visual only). */
  layers: {
    /** Liquid Glass edge highlight — a bright rim that subtly shimmers. */
    shimmerRim?: boolean
    /** Soft tint gradient blended over the material. */
    tint?: string
  }
  /** Scrollable content area between header and footer. */
  scrollArea: string
  /** Section header row (e.g. "Favorites", "iCloud"). */
  sectionHeader: string
  /** Chevron inside the section header (revealed on hover). */
  sectionChevron: string
  /** Wrapper around a section's items. */
  sectionGroup: string
  /** One navigation row, layout + typography. State styles live below. */
  item: {
    base: string
    hover: string
    active: string
    pressed: string
    disabled: string
    /** Fixed-width leading slot the disclosure chevron sits in. */
    disclosure: string
    /** Chevron glyph itself (rotates 90° when expanded). */
    chevron: string
    /** Fixed-width slot that centers the 17px icon. */
    iconSlot: string
    icon: string
    /** Thumbnail images (album art, avatars) rendered instead of an icon. */
    image: string
    label: string
    /** Right-aligned unread/item count — plain gray text on macOS. */
    count: string
    /** Indentation added per nesting depth. */
    indentPerLevel: number
  }
}

const macos: SidebarTheme = {
  pane: [
    // Frosted sidebar material. In a Craft window with `webSidebarMaterial`
    // the native vibrancy shows through; in a browser the backdrop blur
    // approximates it over whatever sits behind the pane.
    //
    // The opacity is deliberately high. Sampling Mail.app over a saturated
    // blue wallpaper, the pane moved by one or two 8-bit steps (#f1f2f2 to
    // #f1f2f3) — AppKit's sidebar material is nearly opaque and only lets a
    // hint of the backdrop through. A half-transparent pane reads as a web
    // imitation, and over a dark page it inverts into a dark bar entirely.
    'bg-[#f2f2f4]/90 dark:bg-[#1c1c1e]/88',
    'backdrop-blur-[50px] backdrop-saturate-[180%]',
    'text-black dark:text-white',
    'select-none',
  ].join(' '),
  selection: 'accent',
  layers: {
    shimmerRim: true,
  },
  scrollArea: 'flex-1 overflow-y-auto overflow-x-hidden px-[10px] pb-[10px]',
  sectionHeader: [
    'group/section flex w-full items-center',
    'pl-[8px] pr-[6px] pt-[16px] pb-[5px]',
    'text-[11px] font-semibold leading-[13px]',
    'text-[#3c3c43]/60 dark:text-[#ebebf5]/60',
  ].join(' '),
  sectionChevron: [
    'i-f7-chevron-down h-[11px] w-[11px] ml-auto',
    'text-[#3c3c43]/45 dark:text-[#ebebf5]/45',
    'opacity-0 group-hover/section:opacity-100 transition-opacity duration-150',
    'transition-transform duration-200',
  ].join(' '),
  // No gap: AppKit rows are contiguous, the 32px pitch IS the row.
  sectionGroup: 'flex flex-col',
  item: {
    base: [
      'flex w-full items-center',
      'h-[32px] rounded-[8px] pl-[4px] pr-[8px]',
      'text-[13px] leading-[16px] font-normal',
      'text-black dark:text-white',
      'transition-colors duration-150 ease-out',
      'cursor-default',
    ].join(' '),
    hover: 'hover:bg-black/4 dark:hover:bg-white/6',
    // Selection is painted by the `accent` model in Sidebar.stx's scoped CSS,
    // which has to recolor the label, icon and count together. Leaving this
    // empty keeps the controller from also stacking a conflicting background.
    active: '',
    pressed: 'active:bg-black/10 dark:active:bg-white/18',
    disabled: 'opacity-40 pointer-events-none',
    disclosure: 'flex h-[16px] w-[18px] shrink-0 items-center justify-center',
    chevron: [
      'i-f7-chevron-right h-[11px] w-[11px]',
      'text-[#3c3c43]/55 dark:text-[#ebebf5]/55',
      'transition-transform duration-200 ease-out',
    ].join(' '),
    iconSlot: 'flex h-[20px] w-[22px] shrink-0 items-center justify-center mr-[7px]',
    icon: 'h-[17px] w-[17px]',
    image: 'h-[20px] w-[20px] rounded-[4px] object-cover shadow-sm',
    label: 'flex-1 truncate text-left',
    count: [
      'ml-[8px] shrink-0 tabular-nums',
      'text-[13px] leading-[16px]',
      'text-[#3c3c43]/60 dark:text-[#ebebf5]/60',
    ].join(' '),
    indentPerLevel: 16,
  },
}

/**
 * Legacy themes carried over from the old per-component variant maps so
 * existing apps keep rendering identically. New work should use `macos`.
 */
const workspace: SidebarTheme = {
  selection: 'classes',
  pane: 'bg-[#f4f4f3] dark:bg-neutral-950 text-zinc-950 dark:text-white select-none',
  layers: {},
  scrollArea: 'flex-1 overflow-y-auto overflow-x-hidden px-5 py-5',
  sectionHeader: 'group/section flex w-full items-center gap-2.5 px-4 pb-2 pt-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500',
  sectionChevron: 'i-f7-chevron-down h-3 w-3 ml-auto opacity-0 group-hover/section:opacity-100 transition-opacity duration-150 transition-transform duration-200',
  sectionGroup: 'flex flex-col space-y-1',
  item: {
    base: 'flex w-full items-center gap-3 rounded-[16px] px-3.5 py-2 text-[14px] leading-tight transition-colors duration-150',
    hover: 'hover:bg-[#ececea] hover:text-zinc-950 dark:hover:bg-white/10',
    active: 'bg-[#e7e7e5] text-zinc-950 dark:bg-white/12 dark:text-white',
    pressed: 'active:bg-[#e2e2e0] dark:active:bg-white/15',
    disabled: 'opacity-50 pointer-events-none',
    disclosure: 'flex h-4 w-4 shrink-0 items-center justify-center',
    chevron: 'i-f7-chevron-right h-3 w-3 opacity-50 transition-transform duration-200',
    iconSlot: 'flex h-5 w-5 shrink-0 items-center justify-center',
    icon: 'h-[18px] w-[18px] text-zinc-500 dark:text-zinc-500',
    image: 'h-5 w-5 rounded object-cover',
    label: 'flex-1 truncate text-left text-zinc-700 dark:text-zinc-300',
    count: 'ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-white/70 px-1.5 text-[11px] font-medium text-zinc-500 shadow-sm dark:bg-white/10 dark:text-zinc-400',
    indentPerLevel: 12,
  },
}

const desktop: SidebarTheme = {
  selection: 'classes',
  pane: 'bg-[#f3f3f1]/48 dark:bg-neutral-950/32 backdrop-blur-3xl backdrop-saturate-150 text-zinc-950 dark:text-white select-none',
  layers: {
    tint: 'bg-[linear-gradient(112deg,rgba(255,255,255,0.20)_0%,rgba(255,255,255,0.04)_45%,rgba(226,226,222,0.16)_100%)] dark:bg-[linear-gradient(112deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_46%,rgba(255,255,255,0.06)_100%)]',
  },
  scrollArea: 'flex-1 overflow-y-auto overflow-x-hidden px-5 py-2',
  sectionHeader: 'group/section flex w-full items-center gap-2.5 px-3 pb-1.5 pt-3 rounded-[14px] text-[12px] font-semibold uppercase tracking-[0.10em] text-zinc-500/80 dark:text-zinc-400/80',
  sectionChevron: 'i-f7-chevron-down h-3 w-3 ml-auto opacity-0 group-hover/section:opacity-100 transition-opacity duration-150 transition-transform duration-200',
  sectionGroup: 'flex flex-col space-y-1',
  item: {
    base: 'flex w-full items-center gap-3 rounded-[14px] px-3 py-1.5 text-[13.5px] leading-tight transition-colors duration-150',
    hover: 'hover:bg-white/38 hover:text-zinc-950 dark:hover:bg-white/10',
    active: 'bg-[#e8e8e6]/90 text-zinc-950 dark:bg-white/12 dark:text-white',
    pressed: 'active:bg-white/50 dark:active:bg-white/15',
    disabled: 'opacity-50 pointer-events-none',
    disclosure: 'flex h-4 w-4 shrink-0 items-center justify-center',
    chevron: 'i-f7-chevron-right h-3 w-3 opacity-50 transition-transform duration-200',
    iconSlot: 'flex h-5 w-5 shrink-0 items-center justify-center',
    icon: 'h-[18px] w-[18px] text-zinc-600 dark:text-zinc-400',
    image: 'h-5 w-5 rounded object-cover',
    label: 'flex-1 truncate text-left text-zinc-700 dark:text-zinc-300',
    count: 'ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-white/72 px-1.5 text-[11px] font-medium text-zinc-500 shadow-sm dark:bg-white/10 dark:text-zinc-400',
    indentPerLevel: 12,
  },
}

/**
 * `arc` — the Arc browser sidebar.
 *
 * Where macOS paints the selected row with the system accent, Arc raises it:
 * the active row becomes a white card floating on a warm tinted panel, with a
 * hairline border and a single-pixel drop shadow. That inversion — light card
 * on tinted ground, rather than saturated fill on gray — is the whole look, so
 * this theme uses the `classes` selection model and puts the card in
 * `item.active` instead of the accent rules the `accent` model applies.
 *
 * Metrics taken from Arc 1.5x at @2x:
 *
 *   row pitch 30px with 2px between rows — rows are separate cards, not the
 *     contiguous run AppKit uses, so consecutive selections read as distinct
 *   selection radius 8px · white fill · 1px hairline · shadow 0 1px 2px/8%
 *   label 13px, and the selected row goes to 500 (not 600 — Arc keeps the
 *     weight shift subtle because the card already carries the emphasis)
 *   section header 11px medium, sentence case, 55% muted
 *   icon 16px in an 18px slot · child indent 14px
 *   panel warm off-white (#f7f5f1), noticeably warmer than macOS's neutral
 *     #f2f2f4 — the warmth is what makes it read as Arc at a glance
 *
 * The panel tint is a soft top-down gradient rather than a flat fill, which is
 * how Arc suggests the current space's color. Apps that want a per-space tint
 * can override `--stx-sidebar-tint` on the pane; the gradient falls back to the
 * warm default when it is unset.
 */
const arc: SidebarTheme = {
  selection: 'classes',
  pane: [
    'bg-[#f7f5f1]/92 dark:bg-[#1a1a1c]/92',
    'backdrop-blur-[40px] backdrop-saturate-[160%]',
    'text-[#2c2a28] dark:text-[#ededf0]',
    'select-none',
  ].join(' '),
  layers: {
    // Space tint. `--stx-sidebar-tint` lets an app color the panel per space
    // the way Arc does; unset, it resolves to a warm neutral wash.
    tint: [
      'bg-[linear-gradient(180deg,var(--stx-sidebar-tint,rgba(255,251,242,0.55))_0%,rgba(255,255,255,0)_38%)]',
      'dark:bg-[linear-gradient(180deg,var(--stx-sidebar-tint,rgba(255,255,255,0.05))_0%,rgba(255,255,255,0)_42%)]',
    ].join(' '),
  },
  // 16px, not 8. Measured against Dia at 2x: its panel is 229pt wide and its
  // selected row 196pt, inset 16pt on each side. At 8px the rows run almost to
  // the panel edge and read as bursting out of it, which was the largest
  // remaining structural difference between this theme and the thing it is
  // named after. `SidebarPinned` drops its own padding to compensate, so the
  // favourites grid stays near full-bleed the way Dia's is.
  scrollArea: 'flex-1 overflow-y-auto overflow-x-hidden px-[16px] pb-[8px]',
  // Text takes its color from the panel rather than declaring its own, and is
  // muted with opacity instead. On the plain warm panel `currentColor` is the
  // pane's own `#2c2a28`, so this renders identically to a hardcoded value —
  // but inside a space it becomes `--stx-space-ink` and the whole list shifts
  // hue with the panel on every swipe. Opacity is safe on these because each
  // is a standalone span; the row itself keeps a solid color, since fading a
  // row would take its white selection card down with it.
  sectionHeader: [
    'group/section flex w-full items-center',
    'px-[8px] pt-[14px] pb-[4px]',
    'text-[11px] font-medium leading-[13px]',
    'opacity-55',
  ].join(' '),
  sectionChevron: [
    'i-f7-chevron-down h-[10px] w-[10px] ml-auto',
    'opacity-0 group-hover/section:opacity-100 transition-opacity duration-150',
    'transition-transform duration-200',
  ].join(' '),
  // 2px gutter: Arc rows are discrete cards, unlike AppKit's contiguous run.
  sectionGroup: 'flex flex-col space-y-[2px]',
  item: {
    base: [
      'flex w-full items-center',
      'h-[30px] rounded-[8px] pl-[6px] pr-[8px]',
      'text-[13px] leading-[16px] font-normal',
      'text-current',
      'transition-[background-color,box-shadow,color] duration-150 ease-out',
      'cursor-default',
    ].join(' '),
    hover: 'hover:bg-white/55 dark:hover:bg-white/8',
    // The signature: a raised white card rather than an accent fill. The label
    // stays on the panel ink — Arc does not recolor a selected row, the card
    // under it carries the emphasis.
    active: [
      'bg-white dark:bg-white/14',
      'font-medium',
      'shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35)]',
      'ring-1 ring-black/5 dark:ring-white/8',
    ].join(' '),
    pressed: 'active:bg-white/80 dark:active:bg-white/18',
    disabled: 'opacity-40 pointer-events-none',
    disclosure: 'flex h-[16px] w-[16px] shrink-0 items-center justify-center',
    chevron: [
      'i-f7-chevron-right h-[10px] w-[10px] opacity-45',
      'transition-transform duration-200 ease-out',
    ].join(' '),
    iconSlot: 'flex h-[18px] w-[18px] shrink-0 items-center justify-center mr-[8px]',
    icon: 'h-[16px] w-[16px]',
    image: 'h-[18px] w-[18px] rounded-[5px] object-cover shadow-sm',
    label: 'flex-1 truncate text-left',
    count: [
      'ml-[8px] shrink-0 tabular-nums',
      'text-[12px] leading-[16px] opacity-45',
    ].join(' '),
    indentPerLevel: 14,
  },
}

const solid: SidebarTheme = {
  ...macos,
  pane: 'bg-stone-100 dark:bg-neutral-900 text-black dark:text-white select-none',
  layers: {},
}

const transparent: SidebarTheme = {
  ...macos,
  pane: 'bg-transparent text-black dark:text-white select-none',
  layers: {},
}

const vibrancy: SidebarTheme = {
  ...macos,
  pane: 'bg-white/50 dark:bg-black/40 backdrop-blur-3xl backdrop-saturate-200 text-black dark:text-white select-none',
  layers: {},
}

export const sidebarThemes: Record<string, SidebarTheme> = {
  macos,
  // Historical names people may still pass — all render the macOS look.
  'tahoe': macos,
  'macos-tahoe': macos,
  'macos-latest': macos,
  arc,
  workspace,
  desktop,
  solid,
  transparent,
  vibrancy,
}

export type SidebarThemeName = keyof typeof sidebarThemes

export function resolveSidebarTheme(name?: string): SidebarTheme {
  return sidebarThemes[name || 'macos'] || sidebarThemes.macos
}

/**
 * Resolve an item's icon tint. Accepts a macOS system color name
 * (`"blue"`, `"red"`, …) or any CSS color, and falls back to the
 * theme's default icon color when unset.
 */
export function resolveIconColor(color?: string): string | undefined {
  if (!color)
    return undefined
  return macosColors[color as MacosColor] || color
}
