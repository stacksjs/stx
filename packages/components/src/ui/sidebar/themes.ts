/**
 * Sidebar theme registry
 *
 * Every visual decision the sidebar makes lives here, expressed as utility
 * classes, so a theme can be read top-to-bottom like a spec sheet.
 *
 * The flagship theme is `macos` — a faithful recreation of the sidebar in
 * the latest macOS (Tahoe, macOS 26/27 "Liquid Glass"). Its metrics were
 * measured from native apps (Mail, Music, Notes) at @2x:
 *
 *   row pitch 32px = 30px row + 2px gap · highlight radius 9px
 *   label 13px · count 13px secondary gray · section header 11px semibold
 *   icon 17px in a fixed 22px slot · disclosure gutter 18px · child indent 16px
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

/** Class groups a sidebar theme provides. All values are utility classes. */
export interface SidebarTheme {
  /** The <aside> pane itself: material, text color, borders. */
  pane: string
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
    'bg-white/55 dark:bg-[#1e1e23]/55',
    'backdrop-blur-[60px] backdrop-saturate-[1.8]',
    'text-black dark:text-white',
    'select-none',
  ].join(' '),
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
  sectionGroup: 'flex flex-col gap-[2px]',
  item: {
    base: [
      'flex w-full items-center',
      'h-[30px] rounded-[9px] pl-[4px] pr-[8px]',
      'text-[13px] leading-[16px] font-normal',
      'text-black dark:text-white',
      'transition-colors duration-150 ease-out',
      'cursor-default',
    ].join(' '),
    hover: 'hover:bg-black/4 dark:hover:bg-white/6',
    active: 'bg-black/8 dark:bg-white/14',
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
