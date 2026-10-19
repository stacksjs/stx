export { default as GroupedList } from './GroupedList.stx'
export { default as GroupedListRow } from './GroupedListRow.stx'

/** An inset grouped section: a heading, a rounded group of rows, a note. */
export interface GroupedListProps {
  title?: string
  footer?: string
  /** Flush to the screen edges rather than inset by the gutter. */
  flush?: boolean
  testID?: string
  className?: string
}

/** One row of a `<GroupedList>`. */
export interface GroupedListRowProps {
  title: string
  subtitle?: string
  /** A value at the row's end. */
  value?: string
  /** Inline SVG drawn white on a tile of the `tint` role. */
  icon?: string
  tint?: 'accent' | 'success' | 'danger' | 'warning' | 'info' | 'secondary'
  /** Draw a disclosure chevron; the row becomes pressable. */
  chevron?: boolean
  /** Pressable without a chevron. */
  pressable?: boolean
  /** Paint the title as a destructive action. */
  destructive?: boolean
  /** Draw the hairline above this row: every row but the first. */
  separator?: boolean
  testID?: string
  className?: string
  onSelect?: () => void
}
