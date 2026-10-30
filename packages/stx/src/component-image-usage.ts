/** Select by authored API, never by a signal's current (possibly empty) value. */
export function usesSharedImageApi(names: Iterable<string>, events: Iterable<string> = [], initial: Record<string, unknown> = {}): boolean {
  const props = new Set([...names].map(name => name.replace(/[-_]/g, '').toLowerCase()))
  if (!props.has('src') || (!props.has('alt') && !props.has('decorative'))) return false
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
  // Source/resizeMode and native lifecycle aliases retain their primitive
  // contract. Browser transformation/preload options still belong to StxImage.
  if (['source', 'resizemode', 'defaultsource', 'provider', 'format', 'densities', 'quality', 'preload', 'modifiers', 'preset'].some(name => props.has(name))) return false
  if ([...events].some(event => !['load', 'error'].includes(event.replace(/^@/, '').split('.')[0].toLowerCase()))) return false
  // Plain src calls keep their old builtin/primitive selection. These authored
  // presentation props opt into the shared component on both targets.
  return ['fit', 'objectfit', 'position', 'objectposition', 'rounded', 'aspectratio', 'zoomonhover', 'sources', 'webpsrc', 'webpsrcset'].some(name => props.has(name))
}
