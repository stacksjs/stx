export { default as FilterChip } from './FilterChip.stx'
export { default as FilterChips } from './FilterChips.stx'
export { default as ListRow } from './ListRow.stx'
export { default as NavBar } from './NavBar.stx'
export { default as SectionCard } from './SectionCard.stx'
export { default as TabBar } from './TabBar.stx'
export { default as TabBarItem } from './TabBarItem.stx'

/** One destination in the bottom tab bar. */
export interface TabBarItemProps {
  label: string
  href: string
  /** Inline SVG (or any markup) for the glyph. The bar ships no icon set. */
  icon?: string
  active?: boolean
  /** A count beside the glyph. Zero and empty render nothing. */
  badge?: string | number
}

export interface TabBarProps {
  items: TabBarItemProps[]
  className?: string
}

/**
 * A filter pill. `menu: true` means it opens a picker rather than toggling the
 * list in place, and draws a chevron to say so.
 */
export interface FilterChipProps {
  label: string
  href: string
  active?: boolean
  menu?: boolean
  count?: string | number
}

export interface FilterChipsProps {
  chips: FilterChipProps[]
  className?: string
}

/**
 * A dense list row. Everything but `title` is optional, and nothing absent
 * reserves space — the same component is a two-line notification and a
 * five-line issue.
 */
export interface ListRowProps {
  title: string
  /** Small line above the title — a repository, an owner, a path. */
  eyebrow?: string
  /** Small line below the title — an actor, a branch, a summary. */
  detail?: string
  /** Top right, usually a relative time. */
  meta?: string
  /** Bottom right — a comment count, a diff stat, a status. */
  trailing?: string
  icon?: string
  unread?: boolean
  href?: string
  className?: string
}

/** A titled group of rows on a rounded card. The title sits outside the card. */
export interface SectionCardProps {
  title?: string
  action?: string
  actionHref?: string
  className?: string
}

export interface NavBarProps {
  /** The large, display-sized title. Scrolls away with the content. */
  title?: string
  /** The small centre title beside a back button. */
  compactTitle?: string
  backHref?: string
  /** Markup for the right-hand controls. */
  actions?: string
  className?: string
}
