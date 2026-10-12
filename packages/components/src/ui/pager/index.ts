export { default as Pager } from './Pager.stx'
export { default as PagerDots } from './PagerDots.stx'

export interface PagerProps {
  /** The page shown, from 0. Use `v-model:index`, or `:index` with `@change`. */
  index?: number
  /** The carousel's accessible name. */
  label?: string
  /** Swiping (and the arrow keys) between pages. Off leaves moving to the page's own buttons. */
  swipe?: boolean
  /** The built-in dots under the pages. Off for a `<PagerDots>` placed elsewhere. */
  dots?: boolean
  dotsLabel?: string
  /** Each page's label, `{n}` and `{total}` filled in. Default "{n} of {total}". */
  slideLabel?: string
  /** Each dot's label, `{n}` filled in. Default "Go to page {n}". */
  goToLabel?: string
  className?: string
  trackClass?: string
  dotsClass?: string
}

export interface PagerDotsProps {
  /** The page shown, from 0. Use `v-model:index`, or `:index` with `@change`. */
  index?: number
  count: number
  label?: string
  /** Each dot's label, `{n}` filled in. Default "Go to page {n}". */
  goToLabel?: string
  className?: string
}
