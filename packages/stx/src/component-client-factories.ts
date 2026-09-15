import { createHash } from 'node:crypto'

export const COMPONENT_CLIENT_FACTORIES_CONTEXT_KEY = '__stx_component_client_factories'

interface ComponentClientFactory {
  body: string
  instances: number
}

type ComponentClientFactoryRegistry = Map<string, ComponentClientFactory>

function registryFrom(context: Record<string, unknown>): ComponentClientFactoryRegistry | null {
  const registry = context[COMPONENT_CLIENT_FACTORIES_CONTEXT_KEY]
  return registry instanceof Map ? registry as ComponentClientFactoryRegistry : null
}

export function initializeComponentClientFactories(context: Record<string, unknown>): void {
  context[COMPONENT_CLIENT_FACTORIES_CONTEXT_KEY] = new Map<string, ComponentClientFactory>()
}

export function registerComponentClientFactory(
  context: Record<string, unknown>,
  factoryBody: string,
): string | null {
  const registry = registryFrom(context)
  if (!registry)
    return null

  const id = createHash('sha256').update(factoryBody).digest('hex').slice(0, 16)
  const existing = registry.get(id)
  if (existing)
    existing.instances++
  else
    registry.set(id, { body: factoryBody, instances: 1 })

  return id
}

export function injectComponentClientFactories(
  html: string,
  context: Record<string, unknown>,
): string {
  const registry = registryFrom(context)
  if (!registry?.size)
    return html

  // One pass over the document, not one per factory.
  //
  // This was a whole-document `replace` inside the registry loop, so a page with
  // three inlinable factories rebuilt its own markup three times — 427KB per
  // render on the #1945 fixture. The invocations are disjoint (each names
  // exactly one id), so a single alternation resolves all of them in one
  // rebuild.
  //
  // Ids are escaped for the regex, which the per-id version did not do: it
  // interpolated `JSON.stringify(id)` straight into the pattern, so an id
  // carrying a regex metacharacter silently failed to match and its factory was
  // never inlined. Nothing generates such an id today; escaping means nothing
  // starts to.
  const inlinable = new Map<string, string>()
  for (const [id, factory] of registry) {
    if (factory.instances === 1)
      inlinable.set(id, factory.body)
  }

  let output = html
  if (inlinable.size > 0) {
    const alternation = [...inlinable.keys()]
      .map(id => JSON.stringify(id).replace(/[$()*+.?[\\\]^{|}]/g, '\\$&'))
      .join('|')
    const invocation = new RegExp(
      `window\\.__stxComponentFactories\\[(${alternation})\\]\\(("[^"]+")\\);`,
      'g',
    )
    // A replacement is never rescanned, so an inlined body that happens to
    // contain another factory invocation is left alone. The per-id loop would
    // have rewritten inside it on a later iteration; not doing that is the safer
    // of the two, and matches how the other batched restores in this pipeline
    // behave.
    output = output.replace(invocation, (match, idLiteral: string, scopeId: string) => {
      const body = inlinable.get(JSON.parse(idLiteral) as string)
      return body === undefined ? match : `(${body})(${scopeId});`
    })
  }

  const repeatedFactories = [...registry].filter(([, factory]) => factory.instances > 1)
  if (repeatedFactories.length === 0)
    return output

  // Each definition is isolated (stacksjs/stx#1773, D4). These all share one
  // <script>, so a single throw while evaluating one factory body aborted the
  // element and every LATER component in it silently never registered — the
  // component then renders completely dead (literal moustaches, stuck :show)
  // with nothing pointing at the component that actually broke. One try/catch
  // per factory contains the blast radius to the one that failed and names it.
  const definitions = repeatedFactories
    .map(([id, factory]) => `  try { factories[${JSON.stringify(id)}] = factories[${JSON.stringify(id)}] || ${factory.body}; }\n`
      + `  catch (e) { console.error('[stx] component factory ' + ${JSON.stringify(id)} + ' failed to register; instances of it will not hydrate.', e); }`)
    .join('\n')
  const prelude = `<script data-stx-scoped data-stx-run="always" data-stx-component-factories>
(function() {
  const factories = window.__stxComponentFactories = window.__stxComponentFactories || {};
${definitions}
})();
</script>`

  const firstScopedScript = output.search(/<script\b(?=[^>]*\bdata-stx-scoped\b)/i)
  if (firstScopedScript < 0)
    return `${prelude}\n${output}`

  return `${output.slice(0, firstScopedScript)}${prelude}\n${output.slice(firstScopedScript)}`
}

/**
 * The registrations a memoised component render would otherwise not make
 * (stacksjs/stx#1945).
 *
 * `instances` decides how a factory reaches the page: at one instance
 * `injectComponentClientFactories` inlines the definition over the call, and at
 * more than one it emits a shared prelude instead. So the count is an input to
 * the document's final bytes, not bookkeeping. A component whose output is
 * served from a cache never reaches `registerComponentClientFactory`, the count
 * stays at zero, and the definition is never inlined — the call survives into
 * the page referring to a factory nothing ever defined, and the component does
 * not hydrate. The whole page also stops being byte-identical between renders,
 * which is the property #1945 exists to establish.
 *
 * Replaying the registrations on a cache hit keeps the count exactly what a
 * full render would have produced. Bodies are replayed rather than ids because
 * the id is derived from the body, so re-registering reproduces it.
 */
export function snapshotComponentClientFactoryCounts(
  context: Record<string, unknown>,
): Map<string, number> {
  const registry = registryFrom(context)
  const counts = new Map<string, number>()
  if (registry) {
    for (const [id, factory] of registry)
      counts.set(id, factory.instances)
  }
  return counts
}

/** The factories registered since `before`, with how many instances each gained. */
export function componentClientFactoriesRegisteredSince(
  context: Record<string, unknown>,
  before: Map<string, number>,
): Array<{ body: string, count: number }> {
  const registry = registryFrom(context)
  if (!registry)
    return []

  const registered: Array<{ body: string, count: number }> = []
  for (const [id, factory] of registry) {
    const gained = factory.instances - (before.get(id) ?? 0)
    if (gained > 0)
      registered.push({ body: factory.body, count: gained })
  }
  return registered
}

/** Re-register what a cached render registered, so the instance counts match. */
export function replayComponentClientFactories(
  context: Record<string, unknown>,
  registered: Array<{ body: string, count: number }>,
): void {
  for (const { body, count } of registered) {
    for (let instance = 0; instance < count; instance++)
      registerComponentClientFactory(context, body)
  }
}
