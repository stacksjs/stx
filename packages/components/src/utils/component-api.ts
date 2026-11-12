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
 * element around exactly one component. Null where there is nothing to find:
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

/** What a component exposes when nothing more precise is known: methods by name. */
// eslint-disable-next-line ts/no-explicit-any
export type ExposedMethods = Record<string, (..._arguments: any[]) => any>

export function componentApi<T = ExposedMethods>(target: Element | string | null | undefined): T | null {
  const element = find(target) as ExposingElement | null
  if (!element || typeof element.closest !== 'function')
    return null

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
