/**
 * `x-` attributes the runtime handles survive on a component
 * (stacksjs/stx#1830).
 *
 * The component renderer rewrites any `x-foo` on a component to `:foo` unless
 * it is in a passthrough list, so the value becomes a signal binding instead of
 * an attribute. That list was maintained by hand beside the runtime's own
 * `X_HANDLED`, and the two disagreed about exactly the pair the runtime added
 * last: `x-tooltip` and `x-tooltip-position` (#1673).
 *
 * So `<StxLink x-tooltip="Settings">` rendered as
 * `<a data-stx-parent-bindings="tooltip" :tooltip="Settings" …>`. Two failures
 * from one mistake: the attribute the runtime looks for is gone, so no tooltip;
 * and `Settings` is now an expression, so the page reports
 *
 *   [stx] hydration invariant failed … 1 expression(s) never evaluated
 *         — Settings → Settings is not defined
 *
 * which takes down hydration for the whole page and names the tooltip's TEXT
 * rather than the tooltip. Unguessable from the authoring side, too: the same
 * attribute on a plain `<button>` works, and every stx builtin is a component.
 *
 * The list is now derived from one source. The drift guard at the bottom is the
 * durable half — this is the fourth time two hand-kept lists of the same thing
 * have disagreed (cf. #1804, #1819, #1820, #1824).
 */
import { describe, expect, it } from 'bun:test'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { COMPONENT_PASSTHROUGH_X_ATTRS, RUNTIME_HANDLED_X_ATTRS } from '../../src/runtime-globals'

const base = {
  ...defaultConfig,
  partialsDir: '/tmp',
  componentsDir: '/tmp',
  layoutsDir: '/tmp',
  autoShell: false,
} as never

function render(template: string): Promise<string> {
  return processDirectives(template, {}, '/app/page.stx', base, new Set<string>())
}

describe('x-tooltip on a component', () => {
  it('reaches the element as x-tooltip, not :tooltip', async () => {
    // The reported case, verbatim. StxLink is a builtin, so this is the shape
    // an app hits without doing anything unusual.
    const out = await render(
      '<StxLink to="/settings" class="icon-btn" x-tooltip="Settings" aria-label="Settings">go</StxLink>',
    )

    expect(out).toContain('x-tooltip="Settings"')
    expect(out).not.toContain(':tooltip=')
  })

  it('does not turn the tooltip text into an expression', async () => {
    // The half that breaks the PAGE rather than the tooltip: `:tooltip` is a
    // real binding, so the runtime evaluates `Settings` as an identifier and
    // hydration fails for everything on the page.
    const out = await render('<StxLink to="/x" x-tooltip="Settings">go</StxLink>')

    expect(out).not.toContain('data-stx-parent-bindings="tooltip"')
  })

  it('carries x-tooltip-position too', async () => {
    const out = await render('<StxLink to="/x" x-tooltip="Save" x-tooltip-position="bottom">go</StxLink>')

    expect(out).toContain('x-tooltip-position="bottom"')
    expect(out).not.toContain(':tooltip-position=')
  })

  it('still works on a plain element, as it always did', async () => {
    const out = await render('<button x-tooltip="Settings">go</button>')

    expect(out).toContain('x-tooltip="Settings"')
  })
})

describe('the passthrough list and the runtime agree', () => {
  /**
   * Pull `X_HANDLED` out of the GENERATED runtime.
   *
   * Throws rather than returning nothing if the shape changes: a drift guard
   * that quietly finds no names is a test that passes because it checked
   * nothing (CLAUDE.md item 41).
   */
  function runtimeHandledNames(): string[] {
    const src = generateSignalsRuntimeDev()
    const match = /var X_HANDLED = \{([^}]*)\}/.exec(src)
    if (!match)
      throw new Error('X_HANDLED not found in the generated runtime')
    const names = [...match[1].matchAll(/'([^']+)'\s*:/g)].map(m => m[1])
    if (names.length === 0)
      throw new Error('X_HANDLED matched but yielded no names')
    return names
  }

  it('emits every runtime-handled attribute into the runtime', () => {
    expect(runtimeHandledNames().sort()).toEqual([...RUNTIME_HANDLED_X_ATTRS].sort())
  })

  it('lets a component carry everything the runtime handles', () => {
    // The invariant that was violated. Anything the runtime consumes must
    // survive on a component, or it is rewritten into a binding over a name
    // that does not exist.
    for (const name of runtimeHandledNames())
      expect(COMPONENT_PASSTHROUGH_X_ATTRS).toContain(name)
  })

  it('keeps the tooltip pair specifically', () => {
    // Named rather than implied, since these are the two that were missing.
    expect(COMPONENT_PASSTHROUGH_X_ATTRS).toContain('x-tooltip')
    expect(COMPONENT_PASSTHROUGH_X_ATTRS).toContain('x-tooltip-position')
  })

  it('still passes the Alpine-bridge attributes the runtime never sees', () => {
    // These are not in X_HANDLED and must not be dropped from the passthrough
    // set when it is derived from it.
    for (const name of ['x-init', 'x-transition', 'x-effect', 'x-on'])
      expect(COMPONENT_PASSTHROUGH_X_ATTRS).toContain(name)
  })
})
