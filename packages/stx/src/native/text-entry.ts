/**
 * HTML's text-field vocabulary, spelled the way a native host reads it.
 *
 * A web view describes a field the web's way: `type="email"`,
 * `autocomplete="current-password"`, `inputmode="numeric"`,
 * `enterkeyhint="go"`, `readonly`. Craft's iOS and Android renderers read
 * none of those for a text field: they take `keyboardType`,
 * `secureTextEntry`, `returnKeyType`, `autoCapitalize`, `autoCorrect` and
 * `editable`. So the same shared EmailInput that brought up the email
 * keyboard in a phone's browser brought up the plain one in the app, and a
 * PasswordInput showed the password it was given as clear text.
 *
 * The projection is computed from the node's own props wherever the runtime
 * describes a node to the host, as the ARIA projection is
 * (accessibility.ts), and recomputed when one of the attributes it reads is
 * written - so a password field's reveal button, which flips `:type`
 * between password and text, turns secure entry off and on in place. A
 * native prop written on the node (`keyboardType="number-pad"`) wins over
 * anything derived here; the derived values are never stored on the node,
 * so they cannot later be mistaken for authored ones.
 *
 * `autocomplete` needs nothing: the hosts read HTML's names for it
 * (`autoComplete`, prop-names.ts) as the platform's autofill hint.
 *
 * @module native/text-entry
 */

/** The native props this projection may set. */
export const TEXT_ENTRY_FIELDS = ['keyboardType', 'secureTextEntry', 'returnKeyType', 'autoCapitalize', 'autoCorrect', 'editable', 'autoComplete'] as const

/** The authored props it reads: a write to one of these re-projects the field. */
export const TEXT_ENTRY_SOURCES = new Set(['type', 'inputmode', 'inputMode', 'enterkeyhint', 'enterKeyHint', 'autoCapitalize', 'autoCorrect', 'spellcheck', 'readonly', 'readOnly', 'disabled', ...TEXT_ENTRY_FIELDS])

/** `inputmode`, which names the keyboard outright and so outranks `type`. */
const INPUT_MODE_KEYBOARDS: Record<string, string> = {
  numeric: 'number-pad',
  decimal: 'decimal-pad',
  tel: 'phone-pad',
  email: 'email-address',
  url: 'url',
  search: 'web-search',
  text: 'default',
}

/** A field type's keyboard, and whether the platform should leave its words alone. */
const TYPE_TRAITS: Record<string, { keyboardType?: string, verbatim?: boolean, secure?: boolean, returnKeyType?: string, autoComplete?: string }> = {
  email: { keyboardType: 'email-address', verbatim: true, autoComplete: 'email' },
  tel: { keyboardType: 'phone-pad', autoComplete: 'tel' },
  url: { keyboardType: 'url', verbatim: true, autoComplete: 'url' },
  number: { keyboardType: 'decimal-pad' },
  search: { keyboardType: 'web-search', returnKeyType: 'search' },
  password: { secure: true, verbatim: true },
}

/** `enterkeyhint` → the return key's label. `enter` is the plain return key. */
const RETURN_KEYS: Record<string, string> = {
  enter: 'default',
  done: 'done',
  go: 'go',
  next: 'next',
  previous: 'default',
  search: 'search',
  send: 'send',
}

function text(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim().toLowerCase()
}

/** A boolean HTML attribute: present (`""`, `"true"`, the name itself) unless it says false. */
function present(value: unknown): boolean {
  if (value === undefined || value === null || value === false) return false
  const spelled = text(value)
  return spelled !== 'false'
}

function given(props: Record<string, unknown>, ...names: string[]): unknown {
  for (const name of names) {
    if (props[name] !== undefined && props[name] !== null) return props[name]
  }
  return undefined
}

/**
 * The native text-field props HTML's attributes imply, for a `TextInput`.
 * Fields the node already carries are left out: an authored native prop wins.
 */
export function projectTextEntry(type: string, props: Record<string, unknown>): Record<string, unknown> {
  if (type !== 'TextInput') return {}
  const derived: Record<string, unknown> = {}
  const fieldType = text(props.type)
  const traits = TYPE_TRAITS[fieldType] ?? {}
  const mode = text(given(props, 'inputmode', 'inputMode'))
  const keyboard = INPUT_MODE_KEYBOARDS[mode] ?? traits.keyboardType
  if (keyboard && keyboard !== 'default') derived.keyboardType = keyboard
  if (traits.secure) derived.secureTextEntry = true
  const hint = text(given(props, 'enterkeyhint', 'enterKeyHint'))
  const returnKey = RETURN_KEYS[hint] ?? traits.returnKeyType
  if (returnKey && returnKey !== 'default') derived.returnKeyType = returnKey
  // HTML's `autocapitalize` arrives as `autoCapitalize` (prop-names.ts), in
  // HTML's words: `off` and `on` are not values a host reads.
  const capitalize = text(props.autoCapitalize)
  if (capitalize === 'off' || capitalize === 'none') derived.autoCapitalize = 'none'
  else if (capitalize === 'on') derived.autoCapitalize = 'sentences'
  else if (!capitalize && traits.verbatim) derived.autoCapitalize = 'none'
  // An address or a password is not a sentence: no capital, no correction.
  const correct = props.autoCorrect
  if (correct === 'off' || correct === 'false' || text(props.spellcheck) === 'false' || (correct === undefined && traits.verbatim)) derived.autoCorrect = false
  else if (correct === 'on' || correct === 'true') derived.autoCorrect = true
  // The hosts disable a field through `editable`; `disabled` is HTML's.
  if (present(given(props, 'readonly', 'readOnly')) || present(props.disabled)) derived.editable = false
  // The platform's autofill hint, when the field type already says what it
  // holds: an email field is offered the person's addresses.
  if (traits.autoComplete) derived.autoComplete = traits.autoComplete
  return Object.fromEntries(Object.entries(derived).filter(([name]) => props[name] === undefined || htmlSpelling(name, props[name])))
}

/** An authored value still in HTML's words, which the projection translates rather than defers to. */
function htmlSpelling(name: string, value: unknown): boolean {
  if (name === 'autoCapitalize') return value === 'off' || value === 'on'
  if (name === 'autoCorrect') return typeof value === 'string'
  return false
}

/**
 * What a write to `changed` does to the projection: the fields that changed,
 * with `null` for one no longer derived (a patch merges on the host side, so
 * an absent key would leave the old value in place). `secureTextEntry`
 * clears to false rather than null, so a revealed password is plainly not
 * secure on both hosts.
 */
export function textEntryChanges(type: string, props: Record<string, unknown>, before: Record<string, unknown>): Record<string, unknown> {
  const after = projectTextEntry(type, props)
  const patch: Record<string, unknown> = {}
  for (const name of TEXT_ENTRY_FIELDS) {
    if (props[name] !== undefined && !htmlSpelling(name, props[name])) continue
    if (JSON.stringify(before[name]) === JSON.stringify(after[name])) continue
    patch[name] = after[name] ?? (name === 'secureTextEntry' ? false : name === 'editable' ? true : null)
  }
  return patch
}

/**
 * Project a compiled node in place, keeping its authored values of the
 * projected fields aside (`_textEntrySource`) so the runtime can tell them
 * from derived ones, as `_accessibilitySource` does for ARIA.
 */
export function applyStaticTextEntry(node: { type: string, props: Record<string, unknown>, _textEntrySource?: Record<string, unknown> }): void {
  const projected = projectTextEntry(node.type, node.props)
  if (!Object.keys(projected).length) return
  node._textEntrySource = Object.fromEntries(TEXT_ENTRY_FIELDS.filter(name => name in node.props).map(name => [name, node.props[name]]))
  Object.assign(node.props, projected)
}

/** A compiled node's props as authored: derived text-field props removed, authored ones restored. */
export function authoredTextEntryProps(props: Record<string, unknown>, source?: Record<string, unknown>): Record<string, unknown> {
  if (!source) return props
  const result = { ...props }
  for (const name of TEXT_ENTRY_FIELDS) delete result[name]
  return Object.assign(result, source)
}
