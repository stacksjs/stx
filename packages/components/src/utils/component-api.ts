/**
 * The methods a component exposes, from outside it.
 *
 * A component hands its methods over with `defineExpose`: an editor's
 * `setValue`, a grid's `setRows`, a menu's `open`. stx keeps them on the
 * element that carries the component's scope, which is a wrapper around the
 * component's own root, and a `ref` written on a component tag does not reach
 * either. So there was no way to call one short of knowing where the runtime
 * keeps it. This is that knowledge, in one place:
 *
 * ```ts
 * import { componentApi } from '@stacksjs/components/component-api'
 *
 * componentApi('#results').setRows(rows)
 * ```
 *
 * The target is the component's own element, or its id, or a selector, or any
 * element around exactly one component. On a native screen, which has no
 * elements, it is the id of a component that registered itself
 * (`registerComponentApi`; `<SettingsWindow>` does). Null where there is nothing to find:
 * on the server, before the component has mounted, or for an element that is
 * not a component. A component mounts after the page's own script has run, so
 * ask for its methods when they are needed, not at the top of the script.
 */

interface ExposingElement extends Element {
  __stx_exposed?: unknown
}

const SCOPE = '[data-stx-scope]'

function find(target: Element | string | null | undefined): Element | null {
  if (!target)
    return null
  if (typeof target !== 'string')
    return target
  if (typeof document === 'undefined')
    return null
  // A bare word is an id, as it is the commonest thing to have.
  const byId = /^[\w-]+$/.test(target) ? document.getElementById(target) : null
  if (byId)
    return byId
  try {
    return document.querySelector(target)
  }
  catch {
    return null
  }
}

/**
 * Where a component on a host with no DOM answers by id.
 *
 * A native screen (Craft's AppKit and phone hosts) has no document to find an
 * element in, so a component that wants to be reached there registers what it
 * exposes under its id, and `componentApi('settings')` reads it back. Kept on
 * the global object, not in this module: the app imports this file from the
 * built package and a component from its source, and the two must agree.
 */
const REGISTRY = '__stxComponentApis'

function registry(): Record<string, unknown> {
  const host = globalThis as unknown as Record<string, Record<string, unknown> | undefined>
  return host[REGISTRY] ?? (host[REGISTRY] = Object.create(null) as Record<string, unknown>)
}

/** Answer `componentApi(id)` with `api` on a host that has no DOM. Returns the undo. */
export function registerComponentApi(id: string, api: unknown): () => void {
  if (!id)
    return () => {}
  const known = registry()
  known[id] = api
  return () => {
    if (known[id] === api)
      delete known[id]
  }
}

/** What a component exposes when nothing more precise is known: methods by name. */
// eslint-disable-next-line ts/no-explicit-any
export type ExposedMethods = Record<string, (..._arguments: any[]) => any>

export function componentApi<T = ExposedMethods>(target: Element | string | null | undefined): T | null {
  const element = find(target) as ExposingElement | null
  if (!element || typeof element.closest !== 'function') {
    // No element to find it on: a native screen, where it registered by id.
    const id = typeof target === 'string' ? target.replace(/^#/, '') : ''
    return id && id in registry() ? registry()[id] as T : null
  }

  if (element.__stx_exposed)
    return element.__stx_exposed as T

  // The component's own root sits inside the scope that holds its methods.
  const around = element.closest(SCOPE) as ExposingElement | null
  if (around?.__stx_exposed)
    return around.__stx_exposed as T

  // An element around a component: the first one inside it.
  for (const inside of Array.from(element.querySelectorAll(SCOPE)) as ExposingElement[]) {
    if (inside.__stx_exposed)
      return inside.__stx_exposed as T
  }
  return null
}
