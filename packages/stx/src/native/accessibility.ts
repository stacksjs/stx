/**
 * HTML's accessibility vocabulary, spelled the way a native host reads it.
 *
 * A shared component describes itself to assistive technology the web's way:
 * `role`, `aria-label`, `aria-pressed`. Both maintained hosts read none of
 * those. Craft's iOS and Android renderers take `accessibilityRole`,
 * `accessibilityLabel`, `accessibilityValue` and an `accessibilityState`
 * object, and the translator passed ARIA through under its HTML names. So a
 * shared control that was correct on the web was silent on a phone: a
 * segmented control's chosen segment never said "selected", and an icon-only
 * button had no label for VoiceOver or TalkBack to read.
 *
 * One mapping serves both halves of a screen's life. The compiler applies it
 * to the static attributes (an authored `accessibility*` prop wins there,
 * since writing both on one node means the native spelling was deliberate),
 * and the runtime applies it to every bound attribute write, where the latest
 * write wins, as it does for any attribute. The ARIA attributes themselves
 * stay on the node: a shared component may read its own `aria-selected` back
 * through the host.
 *
 * @module native/accessibility
 */

/** ARIA states, and the `accessibilityState` key each one sets. */
const STATE_KEYS: Record<string, string> = {
  'aria-pressed': 'selected',
  'aria-selected': 'selected',
  'aria-checked': 'checked',
  'aria-disabled': 'disabled',
  'aria-expanded': 'expanded',
  'aria-busy': 'busy',
}

/**
 * ARIA roles a host can announce, in its own vocabulary.
 *
 * Container roles (`group`, `radiogroup`, `list`, `region`) are left out on
 * purpose. iOS has no trait for them, and Android reads `accessibilityRole`
 * aloud as the role description, so a group would be announced as the word
 * "group" before every control in it. A labelled container is already
 * grouped by both hosts.
 */
const ROLES: Record<string, string> = {
  alert: 'alert',
  button: 'button',
  checkbox: 'checkbox',
  combobox: 'combobox',
  header: 'header',
  heading: 'header',
  image: 'image',
  img: 'image',
  link: 'link',
  menu: 'menu',
  menubar: 'menubar',
  menuitem: 'menuitem',
  none: 'none',
  presentation: 'none',
  progressbar: 'progressbar',
  radio: 'radio',
  scrollbar: 'scrollbar',
  search: 'search',
  searchbox: 'search',
  slider: 'adjustable',
  spinbutton: 'spinbutton',
  switch: 'switch',
  tab: 'tab',
  tablist: 'tablist',
  timer: 'timer',
  toolbar: 'toolbar',
}

/** Whether an attribute is one this module translates. */
export function isAccessibilityAttribute(name: string): boolean {
  return name === 'role' || name === 'aria-label' || name === 'aria-valuetext' || name in STATE_KEYS
}

/**
 * An ARIA state value as the host expects it. `"mixed"` survives for
 * `aria-checked`, where it is a third state; `undefined` means the attribute
 * is gone and the key should be too.
 */
function stateValue(name: string, value: unknown): boolean | 'mixed' | undefined {
  if (value === undefined || value === null) return undefined
  const text = String(value).trim().toLowerCase()
  if (text === 'mixed') return name === 'aria-checked' ? 'mixed' : true
  // A bare attribute (`aria-busy`) is HTML's true; "undefined" is ARIA's
  // spelling of "not set".
  if (text === 'undefined') return undefined
  return text === '' || text === 'true'
}

function nativeRole(value: unknown): string | null {
  if (value === undefined || value === null) return null
  // ARIA allows a fallback list (`role="switch checkbox"`): the first one a
  // host understands is the one to use.
  for (const role of String(value).trim().toLowerCase().split(/\s+/)) {
    if (ROLES[role]) return ROLES[role]
  }
  return null
}

/**
 * The native props an attribute write implies, given the node's current props.
 *
 * Returns `undefined` for an attribute this module does not handle. A `null`
 * value in the result clears the prop, which is what a host patch needs: an
 * absent key means "unchanged".
 */
export function accessibilityPatch(
  name: string,
  value: unknown,
  props: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (name === 'aria-label')
    return { accessibilityLabel: value === undefined || value === null || value === '' ? null : String(value) }
  if (name === 'aria-valuetext')
    return { accessibilityValue: value === undefined || value === null || value === '' ? null : String(value) }
  if (name === 'role')
    return { accessibilityRole: nativeRole(value) }
  const key = STATE_KEYS[name]
  if (!key) return undefined
  const current = props.accessibilityState
  const state: Record<string, unknown> = current && typeof current === 'object' ? { ...current as Record<string, unknown> } : {}
  const next = stateValue(name, value)
  if (next === undefined) delete state[key]
  else state[key] = next
  return { accessibilityState: Object.keys(state).length ? state : null }
}

/**
 * Translate a node's static attributes in place, for the compiler.
 *
 * An authored native spelling wins over the ARIA one, key by key: a node with
 * `accessibilityLabel` and `aria-label` keeps the first, and an authored
 * `accessibilityState` keeps its keys while ARIA fills in the rest.
 */
export function applyStaticAccessibility(props: Record<string, unknown>): void {
  const authoredState = props.accessibilityState && typeof props.accessibilityState === 'object'
    ? props.accessibilityState as Record<string, unknown>
    : undefined
  const derived: Record<string, unknown> = {}
  for (const [name, value] of Object.entries(props)) {
    if (!isAccessibilityAttribute(name)) continue
    const patch = accessibilityPatch(name, value, derived)
    if (patch) Object.assign(derived, patch)
  }
  for (const key of ['accessibilityLabel', 'accessibilityRole', 'accessibilityValue']) {
    if (props[key] === undefined && derived[key] !== undefined && derived[key] !== null)
      props[key] = derived[key]
  }
  const state = derived.accessibilityState as Record<string, unknown> | null | undefined
  if (state)
    props.accessibilityState = { ...state, ...authoredState }
}
