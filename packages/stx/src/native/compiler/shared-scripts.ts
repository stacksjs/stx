/**
 * The component scripts the routes of one build have in common.
 *
 * A screen's setup carries the code of every component it draws: the
 * definitions of the factories its repeated components share
 * (`__stxComponentFactories`, component-client-factories.ts) and the body of
 * each component drawn once. Those are the same components in every screen
 * that draws them: HQ's 74 routes carried 4.2 MB of 24 factory definitions
 * and 2.7 MB of component bodies that came to 1.4 MB distinct.
 *
 * Both are functions of the scope they set up (`function (__scopeId) { … }`),
 * called with the scope's id, so the code can live in the runtime once, by its
 * content, and a route call it. What this does not read as one of the two
 * forms stays in the route as it is. A screen's stores are the same: each is
 * a function that defines it (`NativeClientScript.stores`), and HQ's `auth`
 * store alone was in 70 of its 74 routes.
 */
import type { NativeClientScript } from './setup-script'

export interface SharedScripts {
  /** Component functions (`function (__scopeId) { … }`) by the hash of their content. */
  bodies: Map<string, string>
  /** A screen's scripts, with the shared code replaced by calls to the runtime, by screen name. */
  screens: Map<string, NativeClientScript[]>
}

const bodyHash = (body: string): string => Bun.hash(body).toString(36)

const FACTORIES_SCRIPT = '(function() {\n  const factories = window.__stxComponentFactories = window.__stxComponentFactories || {};\n'
const FACTORY_START = /^ {2}try \{ factories\[("[0-9a-f]+")\] = factories\[\1\] \|\| /gm
const COMPONENT_BODY = /^\(function\(__scopeId\) \{([\s\S]*)\}\)\("([^"\\]+)"\);\s*$/

/**
 * The definitions in a factories script, or null when it is not in the form
 * the generator writes (one `try` per factory, the content hash as the id).
 */
function factoryDefinitions(code: string): Array<{ id: string, body: string, text: string }> | null {
  if (!code.startsWith(FACTORIES_SCRIPT) || !code.endsWith('\n})();'))
    return null
  const starts = [...code.matchAll(FACTORY_START)]
  if (starts.length === 0)
    return null
  const definitions: Array<{ id: string, body: string, text: string }> = []
  let cursor = FACTORIES_SCRIPT.length
  for (const [at, start] of starts.entries()) {
    // Nothing between the definitions but their separators.
    if (start.index !== cursor)
      return null
    const id = JSON.parse(start[1]!) as string
    const from = start.index + start[0].length
    const tail = `; }\n  catch (e) { console.error('[stx] component factory ' + ${JSON.stringify(id)} + ' failed to register; instances of it will not hydrate.', e); }`
    const end = code.indexOf(tail, from)
    if (end < 0 || !code.slice(from, end).startsWith('function(__scopeId) {') && !code.slice(from, end).startsWith('function (__scopeId) {'))
      return null
    const next = starts[at + 1]
    cursor = end + tail.length
    if (next ? code[cursor] !== '\n' || next.index !== cursor + 1 : code.slice(cursor) !== '\n})();')
      return null
    definitions.push({ id, body: code.slice(from, end), text: code.slice(start.index, end + tail.length) })
    cursor = next ? cursor + 1 : cursor
  }
  return definitions
}


/**
 * Pull the code more than one screen has out of every screen's scripts. What
 * only one screen has stays in it: the runtime is read by every screen. A
 * factory and a component drawn once are the same function when they are the
 * same component, so both are counted by content.
 */
export function shareComponentScripts(screens: Array<{ name: string, scripts: NativeClientScript[] }>): SharedScripts {
  // A factory goes by the id the generator gave it, which is a function of its
  // content, so the same body is the same id in every screen; a component
  // drawn once with the same body goes by that id too.
  const factoryIds = new Map<string, string>()
  for (const { scripts } of screens) {
    for (const script of scripts) {
      for (const definition of (script.registry || script.owner ? null : factoryDefinitions(script.code)) ?? [])
        factoryIds.set(definition.body, definition.id)
    }
  }
  const keyOf = (body: string): string => factoryIds.get(body) ?? bodyHash(body)
  const used = new Map<string, Set<string>>()
  const componentOf = (script: NativeClientScript): { body: string, scope: string } | null => {
    const match = script.owner ? COMPONENT_BODY.exec(script.code) : null
    return match ? { body: `function(__scopeId) {${match[1]}}`, scope: match[2]! } : null
  }
  const count = (screen: string, body: string): void => {
    const key = keyOf(body)
    const known = used.get(key) ?? new Set<string>()
    known.add(screen)
    used.set(key, known)
  }
  const common = (body: string): boolean => (used.get(keyOf(body))?.size ?? 0) > 1
  for (const { name, scripts } of screens) {
    for (const script of scripts) {
      if (script.registry)
        continue
      for (const definition of (script.owner ? null : factoryDefinitions(script.code)) ?? [])
        count(name, definition.body)
      const component = componentOf(script)
      if (component)
        count(name, component.body)
      for (const store of script.stores ?? [])
        count(name, store)
    }
  }
  const bodies = new Map<string, string>()
  const result = new Map<string, NativeClientScript[]>()
  for (const { name, scripts } of screens) {
    result.set(name, scripts.map((script) => {
      if (script.registry)
        return script
      const definitions = script.owner ? null : factoryDefinitions(script.code)
      if (definitions) {
        const inCommon = definitions.filter(definition => common(definition.body))
        if (inCommon.length === 0)
          return script
        for (const { body } of inCommon)
          bodies.set(keyOf(body), body)
        const own = definitions.filter(definition => !inCommon.includes(definition))
        const ids = inCommon.map(definition => JSON.stringify(definition.id)).join(', ')
        return {
          ...script,
          code: `${FACTORIES_SCRIPT}${own.map(definition => `${definition.text}\n`).join('')}  [${ids}].forEach(function (id) { factories[id] = factories[id] || runtime.components[id]; });\n})();`,
        }
      }
      // The stores the screen defines, in order: those other screens define
      // too run from the runtime, the rest from here.
      if (script.stores?.some(common)) {
        for (const store of script.stores.filter(common))
          bodies.set(keyOf(store), store)
        return { code: `;(function() {\n${script.stores.map(store => common(store) ? `runtime.components[${JSON.stringify(keyOf(store))}]();` : `(${store})();`).join('\n')}\n})();` }
      }
      const component = componentOf(script)
      if (component && common(component.body)) {
        bodies.set(keyOf(component.body), component.body)
        return { ...script, code: `runtime.components[${JSON.stringify(keyOf(component.body))}](${JSON.stringify(component.scope)});` }
      }
      return script
    }))
  }
  return { bodies, screens: result }
}
