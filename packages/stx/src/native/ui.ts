/**
 * The grouped look a native screen is built from, in role classes.
 *
 * Apple's Settings shape: a grouped page, inset groups with rounded corners,
 * 13pt uppercase section headers, 17pt rows at least 44pt tall, hairlines
 * inset to where the text starts, secondary text a step back, and one colour
 * for what can be tapped. Bound as `:class="ui.group"` and the like.
 *
 * Two apps each kept a copy of this vocabulary as literal colours - one in
 * Apple's greys and blue, one in its own greens - and roughly a thousand hex
 * values between them repeated it inline. Written in roles instead, the
 * vocabulary is shared and each app's palette comes from its css config
 * (`roles: { page, panel, fg, accent, ... }`, see docs/features/theming.md),
 * which reaches a native screen as well as the web.
 *
 *   import { nativeUi as ui } from '@stacksjs/stx/native/ui'
 *   <View :class="ui.screen"><Text :class="ui.header">Account</Text><View :class="ui.group">…</View></View>
 *
 * The shared components (`GroupedList`, `SegmentedControl`, `ChoiceChips`,
 * `EmptyState`, `ErrorState`) draw the same shapes from the same roles, so a
 * screen can mix them with hand-built rows and nothing looks borrowed.
 *
 * @module native/ui
 */
export const nativeUi = {
  /** The whole screen: the grouped page behind every group. */
  screen: 'flex-1 bg-page',
  /** A section's header, above a group. */
  header: 'mx-8 mt-7 mb-1.5 text-[13px] uppercase text-fg-soft',
  /** A note under a group. */
  footer: 'mx-8 mt-1.5 text-[13px] text-fg-soft',
  /** An inset grouped section holding rows. */
  group: 'mx-4 overflow-hidden rounded-panel bg-panel',
  /** A group holding a drawing or a block of content rather than rows. */
  card: 'mx-4 p-4 rounded-panel bg-panel',
  /** A row in a group. */
  row: 'flex-row items-center gap-3 px-4 py-2.5 min-h-[44px]',
  /** The hairline between rows, inset to where their text starts. */
  separator: 'ml-4 h-[0.5px] bg-line',
  /** The same, past a 29pt icon tile. */
  separatorIcon: 'ml-[57px] h-[0.5px] bg-line',
  /** A screen's own heading, where the navigation bar does not carry one. */
  heading: 'text-[30px] font-bold text-fg',
  /** A row's main words. */
  title: 'text-[17px] text-fg',
  /** A row's main words, emphasised. */
  titleStrong: 'text-[17px] font-semibold text-fg',
  /** Running text. */
  body: 'text-[17px] text-fg-strong',
  /** A line under a title. */
  subtitle: 'text-[15px] text-fg-soft',
  /** Small print: a caption, a date, a unit. */
  caption: 'text-[13px] text-fg-soft',
  /** A value at a row's end. */
  value: 'text-[17px] text-fg-soft',
  /** A big number in a stat. */
  figure: 'text-[22px] font-semibold text-fg',
  /** The disclosure chevron: it says the row opens something, so it stays legible. */
  chevron: 'h-3.5 w-3.5 text-fg-soft',
  /** Something to tap, as words. */
  tint: 'text-accent',
  /** Something that cannot be undone, as words. */
  destructive: 'text-danger',
  /** A status that needs attention but is not an error. */
  warning: 'text-warning',
  /** A form field. */
  input: 'min-h-[44px] px-3 rounded-control bg-surface-sunken text-[17px] text-fg',
  /**
   * A field of several lines. Panel corners, not the control's: an app whose
   * controls are pills would otherwise round a paragraph into a capsule and
   * clip its first and last letters at the ends.
   */
  textarea: 'min-h-[96px] px-3 py-2.5 rounded-panel bg-surface-sunken text-[17px] text-fg',
  /** The search field at the top of a list. */
  search: 'flex-row items-center gap-2 mx-4 px-2.5 h-9 rounded-control bg-surface-sunken',
  /** The filled button at the end of a flow, and its words. */
  primaryButton: 'items-center justify-center min-h-[50px] px-4 rounded-control bg-accent-solid',
  primaryButtonText: 'text-[17px] font-semibold text-accent-ink',
  /** A quieter button beside it, and its words. */
  secondaryButton: 'items-center justify-center min-h-[44px] px-3 rounded-control bg-surface-sunken',
  secondaryButtonText: 'text-[15px] font-semibold text-fg-strong',
  /** A button floating over a map or a photograph. */
  floatingButton: 'items-center justify-center min-h-[44px] px-3 rounded-pill bg-panel shadow-md',
  /** A filled destructive button, and its words. */
  destructiveButton: 'items-center justify-center min-h-[50px] px-4 rounded-control bg-danger-solid',
  destructiveButtonText: 'text-[17px] font-semibold text-danger-ink',
  /** A rounded-square icon tile leading a row; its glyph is white. */
  iconTile: 'items-center justify-center h-[29px] w-[29px] rounded-[7px] bg-accent-solid',
  iconGlyph: 'h-[18px] w-[18px] text-white',
  /** A tinted note: a notice, a threat, a status that is good news. */
  noticeAccent: 'p-3 rounded-panel bg-accent-soft',
  noticeAccentText: 'text-[15px] text-accent-soft-ink',
  noticeDanger: 'p-3 rounded-panel bg-danger-soft',
  noticeDangerText: 'text-[15px] text-danger-soft-ink',
} as const

export type NativeUiClass = keyof typeof nativeUi
