/**
 * Control shortcuts drawn from the role tokens, for an app to spread into its
 * css config's `shortcuts`:
 *
 *   import { roleShortcuts } from '@stacksjs/stx/role-shortcuts'
 *   export default { shortcuts: { ...roleShortcuts, ...ownShortcuts } }
 *
 * Apps wrote their buttons, fields and badges out in palette shades - one app
 * carried well over a hundred copies of an emerald pill button in a dozen
 * variants, and its sign-in pages used a different radius and palette again.
 * These say what a control is, and the app's role answers (`roles`,
 * `shapes`) say what that looks like, so the library components and the
 * app's own markup cannot drift apart.
 *
 * Identity only, never size: a primary button is a 36pt chip in one place and
 * a full-width 50pt bar in another, so each control keeps its own sizing
 * utilities and takes its shape, colour, weight, focus ring and disabled
 * state from here.
 *
 * Opt-in rather than part of the base config: `btn-primary`, `input` and
 * `card` are names apps already use for their own CSS, which a base shortcut
 * would silently restyle.
 *
 * @module role-shortcuts
 */

const focus = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-panel'
const disabled = 'disabled:cursor-not-allowed disabled:opacity-60'

export const roleShortcuts: Record<string, string> = {
  /** The filled action at the end of a flow. */
  'btn-primary': `rounded-control bg-accent-solid font-semibold text-accent-ink transition hover:bg-accent-solid-hover ${focus} ${disabled}`,
  /** A quieter action beside it. */
  'btn-secondary': `rounded-control bg-panel font-semibold text-fg-strong ring-1 ring-line transition hover:bg-surface-hover ${focus} ${disabled}`,
  /** An action with no surface until it is pointed at. */
  'btn-ghost': `rounded-control font-semibold text-fg-strong transition hover:bg-surface-hover ${focus} ${disabled}`,
  /** Something that cannot be undone. */
  'btn-danger': `rounded-control bg-danger-solid font-semibold text-danger-ink transition hover:bg-danger-solid-hover ${focus} ${disabled}`,
  /** A text field, select or textarea. */
  'input': `rounded-control bg-field text-fg ring-1 ring-line-strong placeholder:text-fg-soft focus:outline-none focus:ring-2 focus:ring-accent ${disabled}`,
  /** A panel on the page. */
  'panel': 'rounded-panel bg-panel ring-1 ring-line',
  /** A status pill, neutral and by status. */
  'badge': 'inline-flex items-center gap-1 rounded-pill bg-surface-sunken px-2.5 py-0.5 text-xs font-medium text-fg-strong',
  'badge-accent': 'inline-flex items-center gap-1 rounded-pill bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-soft-ink',
  'badge-success': 'inline-flex items-center gap-1 rounded-pill bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success-soft-ink',
  'badge-warning': 'inline-flex items-center gap-1 rounded-pill bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning-soft-ink',
  'badge-danger': 'inline-flex items-center gap-1 rounded-pill bg-danger-soft px-2.5 py-0.5 text-xs font-medium text-danger-soft-ink',
  'badge-info': 'inline-flex items-center gap-1 rounded-pill bg-info-soft px-2.5 py-0.5 text-xs font-medium text-info-soft-ink',
}
