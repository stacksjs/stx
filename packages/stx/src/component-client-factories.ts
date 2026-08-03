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

  let output = html
  for (const [id, factory] of registry) {
    if (factory.instances !== 1)
      continue

    const invocation = new RegExp(
      `window\\.__stxComponentFactories\\[${JSON.stringify(id)}\\]\\(("[^"]+")\\);`,
      'g',
    )
    output = output.replace(invocation, (_match, scopeId: string) => `(${factory.body})(${scopeId});`)
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
