/**
 * TransitionGroup Builtin Component (stacksjs/stx#1742)
 *
 * Class-driven enter/leave + FLIP move animations for a keyed list. Renders a
 * single wrapper element marked `data-stx-transition-group="<name>"`; the
 * signals runtime's `bindFor` animates the list items inside it when they are
 * added, removed, or reordered.
 *
 * The default slot must contain a single `:for` (or `x-for`) element whose
 * rendered items become the wrapper's direct children:
 *
 * ```stx
 * <TransitionGroup name="card" tag="ul" class="space-y-2">
 *   <li :for="r in reviews()" :key="r.id" class="card">{{ r.title }}</li>
 * </TransitionGroup>
 * ```
 *
 * With `name="card"`, supply the transition classes (e.g. via crosswind/CSS):
 * `card-enter-from` / `card-enter-active` / `card-enter-to`,
 * `card-leave-from` / `card-leave-active` / `card-leave-to`, and `card-move`
 * (applied to elements that shift position during a reorder). The first render
 * does not animate; subsequent list changes do.
 *
 * @module builtins/transition-group
 */

import type { BuiltinComponentDef, RenderContext, ResolvedProps } from '../component-registry'

function resolveProp(props: ResolvedProps, ...keys: string[]): string | undefined {
  for (const key of keys) {
    if (props.serverDynamic[key] !== undefined)
      return String(props.serverDynamic[key])
    const val = props.static[key]
    if (typeof val === 'string')
      return val
  }
  return undefined
}

export const TransitionGroupBuiltin: BuiltinComponentDef = {
  name: 'TransitionGroup',
  aliases: ['transition-group'],

  render(props: ResolvedProps, slotContent: string, _ctx: RenderContext): string {
    const name = (resolveProp(props, 'name') || 'v').replace(/["'<>]/g, '')
    // The wrapper element tag — sanitised to a safe HTML tag name.
    const tag = (resolveProp(props, 'tag') || 'div').replace(/[^a-z0-9-]/gi, '') || 'div'
    const cls = resolveProp(props, 'class')
    const id = resolveProp(props, 'id')
    const attrs = [
      `data-stx-transition-group="${name}"`,
      cls ? `class="${cls}"` : '',
      id ? `id="${id}"` : '',
    ].filter(Boolean).join(' ')
    return `<${tag} ${attrs}>${slotContent}</${tag}>`
  },
}
