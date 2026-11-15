/**
 * What the Settings components are drawn with on a native host.
 *
 * On the web the look is the `--stx-mac-*` custom properties and each
 * component's stylesheet. A native host (Craft's AppKit host) has neither: it
 * draws views from class lists. Every size, padding, radius and colour the
 * native branches use is in this file and nowhere else, so matching a real
 * System Settings window is a matter of editing one place.
 *
 * The numbers are the web look's own (`src/utils/mac-theme.ts` and the
 * components' stylesheets), which were measured from System Settings on
 * macOS 26. A colour is written as a hex with its dark twin, the way the
 * other shared components spell a native colour: `#000000/85` is black at
 * 85%, which the host receives as `#000000d9`.
 */

/** The tile colours, light and dark. The same ten tones as the web. */
export const SETTINGS_NATIVE_TONES: Readonly<Record<string, string>> = {
  grey: 'bg-[#8e8e93] dark:bg-[#8e8e93]',
  blue: 'bg-[#007aff] dark:bg-[#0a84ff]',
  red: 'bg-[#ff3b30] dark:bg-[#ff453a]',
  orange: 'bg-[#ff9500] dark:bg-[#ff9f0a]',
  yellow: 'bg-[#ffcc00] dark:bg-[#ffd60a]',
  green: 'bg-[#34c759] dark:bg-[#30d158]',
  indigo: 'bg-[#5856d6] dark:bg-[#5e5ce6]',
  purple: 'bg-[#af52de] dark:bg-[#bf5af2]',
  pink: 'bg-[#ff2d55] dark:bg-[#ff375f]',
  // Ink is the page's own ink: near black on light, light on dark.
  ink: 'bg-[#1d1d1f] dark:bg-[#dcdce0]',
}

/** The glyph on a tile: white, and dark on the light `ink` tile of a dark window. */
export function settingsNativeGlyph(tone: string): string {
  return tone === 'ink' ? 'text-[#ffffff] dark:text-[#1d1d1f]' : 'text-[#ffffff]'
}

/** Text colours. */
const INK = 'text-[#000000]/85 dark:text-[#ffffff]/85'
const INK_SECONDARY = 'text-[#000000]/50 dark:text-[#ffffff]/55'
const INK_TERTIARY = 'text-[#000000]/26 dark:text-[#ffffff]/25'
const DANGER = 'text-[#ff3b30] dark:text-[#ff453a]'
const ACCENT_TEXT = 'text-[#007aff] dark:text-[#0a84ff]'
/** The selection: the system blue, and the ink on it. */
const SELECTED_FILL = 'aria-selected:bg-[#007aff] dark:aria-selected:bg-[#0a84ff]'
const SELECTED_INK = 'aria-selected:text-[#ffffff] dark:aria-selected:text-[#ffffff]'
/** The hairline between rows and under the toolbar. */
const SEPARATOR = 'bg-[#000000]/10 dark:bg-[#ffffff]/10'
/** The slightly raised card a group of rows sits on. */
const CARD = 'bg-[#000000]/4 dark:bg-[#ffffff]/5'

export const SETTINGS_NATIVE = {
  // ---------- The window: two columns ----------
  /** The root. Not named `window`: a template's evaluator refuses that word. */
  shell: 'flex-1 flex-row',
  /** The sidebar column. Its width is `sidebarWidth` (226) and its fill sits under the host's sidebar material. */
  sidebar: 'flex-col bg-[#f2f1f0] dark:bg-[#2a2a2a]',
  sidebarWidth: 226,
  /** The AppKit material drawn behind the sidebar (`material` on the host's box). */
  sidebarMaterial: 'sidebar',
  /** Room above the search field: the window buttons sit over the sidebar of a titlebar-less window. */
  sidebarTop: 'pt-[38px] px-[9px] pb-[6px]',
  /** The search field: the system's own search field at this height. */
  search: 'h-[28px] text-[13px]',
  /** The scrolling list under the search field. */
  nav: 'flex-1 flex-col px-[9px] pb-[12px]',
  account: 'mt-[7px]',
  list: 'flex-col pt-[7px]',
  /** A setting a search found: its label over the name of its pane. */
  results: 'flex-col gap-[2px] pt-[7px]',
  result: 'flex-col justify-center min-h-[38px] px-[8px] py-[4px] rounded-[8px] hover:bg-[#000000]/5 dark:hover:bg-[#ffffff]/6',
  resultLabel: `text-[13px] ${INK}`,
  resultPane: `text-[11px] ${INK_SECONDARY}`,
  empty: `py-[24px] px-[8px] text-[13px] text-center ${INK_SECONDARY}`,

  // ---------- The sidebar's rows ----------
  group: 'flex-col gap-[2px]',
  /** The gap above every group but the first one showing: with the 2pt between a group's rows, 13pt. */
  groupGap: 'h-[11px]',
  groupLabel: `px-[8px] pb-[3px] text-[11px] font-semibold ${INK_SECONDARY}`,
  /** One row: 30pt tall, the selected one a blue pill with 8pt corners. */
  item: `flex-row items-center gap-[8px] h-[30px] px-[8px] rounded-[8px] ${SELECTED_FILL}`,
  itemTile: 'h-[20px] w-[20px] rounded-[5.5px] items-center justify-center',
  itemGlyph: 'h-[13px] w-[13px]',
  itemLabel: `flex-1 text-[13px] ${INK} ${SELECTED_INK}`,
  itemBadge: `text-[11px] ${INK_SECONDARY} ${SELECTED_INK}`,

  // ---------- The detail column ----------
  detail: 'flex-1 flex-col bg-[#ffffff] dark:bg-[#1e1e1e]',
  /** Back, forward and the open pane's name. */
  toolbar: 'flex-row items-center gap-[12px] h-[52px] pl-[8px] pr-[16px]',
  history: 'flex-row items-center',
  historyButton: `text-[15px] ${INK_SECONDARY}`,
  /** The pane's name, large, as System Settings titles a pane. */
  title: `flex-1 text-[20px] font-semibold ${INK}`,
  body: 'flex-1 flex-col',
  /** One pane: it scrolls on its own, and its content is inset by this padding. */
  pane: 'flex-1',
  paneContent: 'flex-col px-[20px] pt-[11px] pb-[20px]',

  // ---------- The card at the top of a pane ----------
  hero: `flex-col items-center mb-[10px] p-[22px] rounded-[12px] ${CARD}`,
  heroTile: 'h-[48px] w-[48px] rounded-[12px] items-center justify-center',
  heroGlyph: 'h-[30px] w-[30px]',
  heroTitle: `mt-[10px] text-[17px] font-semibold text-center ${INK}`,
  heroDescription: `mt-[4px] text-[13px] text-center ${INK_SECONDARY}`,
  heroExtra: 'mt-[8px] flex-col items-center',

  // ---------- A group of rows ----------
  section: 'flex-col mb-[10px]',
  sectionHeader: `pt-[18px] px-[10px] pb-[8px] text-[13px] font-bold ${INK}`,
  card: `flex-col rounded-[12px] ${CARD}`,
  sectionFooter: `pt-[6px] px-[10px] text-[11px] ${INK_SECONDARY}`,

  // ---------- One row ----------
  /** The hairline above every row but the first, inset on both sides. */
  rowRule: `mx-[10px] h-[0.5px] ${SEPARATOR}`,
  row: 'flex-row items-center gap-[10px] min-h-[38px] px-[10px]',
  /** A navigation row with a tile is a little taller, as System Settings draws it. */
  rowTall: 'min-h-[44px]',
  rowMultiline: 'items-start',
  rowStacked: 'flex-col items-stretch gap-[4px] min-h-[38px] px-[10px]',
  rowPressed: 'active:bg-[#000000]/5 dark:active:bg-[#ffffff]/6',
  /** The wash a found row wears for a moment: 20% of the accent. */
  rowWash: { light: '#007aff33', dark: '#0a84ff33' },
  rowTile: 'h-[24px] w-[24px] rounded-[6px] items-center justify-center',
  rowTileMultiline: 'mt-[10px]',
  rowGlyph: 'h-[15px] w-[15px]',
  rowText: 'flex-1 flex-col justify-center py-[7px]',
  rowTextMultiline: 'flex-1 flex-col py-[10px]',
  rowTextStacked: 'flex-col pt-[10px]',
  rowLabel: `text-[13px] ${INK}`,
  rowLabelDestructive: `text-[13px] ${DANGER}`,
  rowDescription: `mt-[1px] text-[11px] ${INK_SECONDARY}`,
  rowControl: 'flex-row items-center justify-end gap-[8px]',
  rowControlMultiline: 'flex-row items-center justify-end gap-[8px] py-[10px]',
  rowControlStacked: 'flex-col items-stretch pb-[7px]',
  rowValue: `text-[13px] ${INK_SECONDARY}`,
  rowChevron: `h-[11px] w-[11px] ${INK_TERTIARY}`,
  rowDisabled: 'opacity-50',

  // ---------- The appearance picker ----------
  appearance: 'flex-row gap-[14px]',
  appearanceOption: 'flex-col items-center gap-[5px]',
  /** The picture's frame: a ring in the accent around the chosen one. */
  appearanceFrame: 'p-[3px] rounded-[9px] border-2 border-transparent aria-checked:border-[#007aff] dark:aria-checked:border-[#0a84ff]',
  appearanceThumb: 'h-[44px] w-[67px] flex-row rounded-[6px] overflow-hidden',
  appearanceLight: 'flex-1 bg-[#e9e9eb]',
  appearanceDark: 'flex-1 bg-[#2c2c2e]',
  appearanceCaption: `text-[11px] ${INK}`,

  // ---------- The update row ----------
  updateStatus: `mt-[1px] text-[11px] ${INK_SECONDARY}`,
  updateError: `mt-[1px] text-[11px] ${DANGER}`,
  updateProgress: `text-[11px] ${INK_SECONDARY}`,

  /** Text colours, for a component that needs one outside the lists above. */
  ink: INK,
  inkSecondary: INK_SECONDARY,
  inkTertiary: INK_TERTIARY,
  danger: DANGER,
  accentText: ACCENT_TEXT,
} as const

/** SF Symbols the components draw themselves. */
export const SETTINGS_NATIVE_SYMBOLS = {
  back: 'chevron.left',
  forward: 'chevron.right',
  disclosure: 'chevron.right',
} as const
