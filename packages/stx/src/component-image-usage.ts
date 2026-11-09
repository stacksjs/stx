/** Select by authored API, never by a signal's current (possibly empty) value. */
export function usesSharedImageApi(names: Iterable<string>, events: Iterable<string> = [], initial: Record<string, unknown> = {}): boolean {
  const props = new Set([...names].map(name => name.replace(/[-_]/g, '').toLowerCase()))
  // `source` is the native name for the same URL and now reaches the shared
  // file, which accepts a string or a `{ uri }` payload (#2091).
  if ((!props.has('src') && !props.has('source')) || (!props.has('alt') && !props.has('decorative'))) return false
  // The shared file validates accessibility during SSR. A legacy empty alt,
  // or a client-only caption without an SSR fallback, must not acquire an
  // exception merely because another prop now opts into shared presentation.
  const entries = new Map(Object.entries(initial).map(([name, value]) => [name.replace(/[-_]/g, '').toLowerCase(), value]))
  const alt = entries.get('alt')
  const decorative = entries.get('decorative')
  const meaningful = typeof alt === 'string' && !!alt.trim()
  const decoration = typeof decorative === 'string'
    ? !['false', '0', 'off', 'no'].includes(decorative.trim().toLowerCase()) : Boolean(decorative)
  if (!meaningful && !decoration) return false
  // Native lifecycle aliases retain their primitive contract, and browser
  // transformation/preload options still belong to StxImage. `defaultSource`
  // stays here deliberately: the shared file paints a placeholder rather than
  // a second image, so honouring it would need a contract it does not have.
  if (['defaultsource', 'provider', 'format', 'densities', 'quality', 'preload', 'modifiers', 'preset'].some(name => props.has(name))) return false
  if ([...events].some(event => !['load', 'error'].includes(event.replace(/^@/, '').split('.')[0].toLowerCase()))) return false
  // A call naming the same thing twice, once natively and once for the web,
  // has not said which it means: `fit="contain" resizeMode="center"` asks for
  // two different fits, and `src` beside `source` for two different URLs. The
  // shared file resolves each pair by precedence, which is a decision this
  // selection should not make on the author's behalf, so those calls keep the
  // primitive they already rendered through.
  if (props.has('resizemode') && (props.has('fit') || props.has('objectfit'))) return false
  if (props.has('src') && props.has('source')) return false
  // A `source` the server can read becomes an ordinary `src` on the way in.
  // A client-reactive one cannot: the shared file's own `src` binding owns
  // that prop on the host node, so a `{ uri }` payload delivered past it is
  // overwritten rather than read. Those calls keep the primitive, which takes
  // the payload natively, until the binding layer can carry an object.
  if (!props.has('src')) {
    const authored = entries.get('source')
    const resolvable = typeof authored === 'string' ? !!authored.trim() : !!authored
    if (!resolvable) return false
  }
  // Plain src calls keep their old builtin/primitive selection. These authored
  // presentation props opt into the shared component on both targets.
  // `resizeMode` joins them: it makes the same decision `fit` does, so a call
  // stating it has asked for presentation under either name. A plain `source`
  // call has not, and keeps its primitive selection like a plain `src` one.
  return ['fit', 'objectfit', 'resizemode', 'position', 'objectposition', 'rounded', 'aspectratio', 'zoomonhover', 'sources', 'webpsrc', 'webpsrcset'].some(name => props.has(name))
}
