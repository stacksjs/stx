/**
 * One preservation gate, stamped on the context (stacksjs/stx#1800).
 *
 * `usesSignalsInScript` was already the single predicate — the issue's original
 * premise (seven copies of the heuristic) was wrong. What is spread out is the
 * OVERRIDE each caller passes, because the predicate structurally cannot see
 * what the caller knows: a partial's `<script>` is stripped before expressions
 * run, and slot content belongs to the caller, not to the component.
 *
 * The consolidation is therefore about TRANSPORT, not duplication. The three
 * overrides split across two mechanisms: `options.forceSignals` is per-call,
 * while `__stx_force_signals` and `__stx_client_signal_names` are context keys.
 * Context keys ride the `{ ...context }` spread into the per-iteration contexts
 * `loops.ts` builds; a per-call option does not. The gate is now computed once
 * per render unit, on that unit's ORIGINAL source before any stripping, and
 * stamped on the context so it propagates the same way every other scoped fact
 * does.
 *
 * WIDEN-ONLY: OR-ed with the legacy inputs, never preferred over them.
 * Preferring the stamp would be a NARROWING change and would regress
 * component-injected reactivity. The legacy inputs are retired one at a time,
 * each with its own regression test — see #1800 for the remaining steps.
 *
 * Scope note: this commit is behaviour-neutral by design. The suite is
 * unchanged, and the "preserved outside a loop, emptied inside" case predicted
 * during analysis did NOT reproduce at this commit — every include-in-loop shape
 * probed already preserved correctly. These tests therefore pin the stamp's own
 * contract, which is what the next steps will build on.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

let dir: string

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-gate-'))
  fs.mkdirSync(path.join(dir, 'partials'), { recursive: true })

  // Owns its own signal. Its <script> is stripped before the expression pass,
  // so by then the predicate cannot see the derived().
  fs.writeFileSync(
    path.join(dir, 'partials', 'chip.stx'),
    `<script client>
const label = derived(() => 'live')
</script>
<span class="chip">{{ label() }}</span>`,
  )

  fs.writeFileSync(path.join(dir, 'partials', 'plain.stx'), '<span>{{ mystery }}</span>')
  fs.mkdirSync(path.join(dir, 'components'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'components', 'Alert.stx'), '<div class="alert"><slot /></div>')
})

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

const options = () => ({
  ...defaultConfig,
  partialsDir: path.join(dir, 'partials'),
  componentsDir: path.join(dir, 'components'),
}) as any

/** Render, returning the output AND the context so the stamp is inspectable. */
async function render(template: string) {
  const context: Record<string, any> = {}
  const out = await processDirectives(template, context, path.join(dir, 'page.stx'), options(), new Set<string>())
  return { out, context }
}

describe('the gate is stamped on the context', () => {
  it('stamps true for a template whose script declares signals', async () => {
    const { context } = await render('<script client>\nconst n = state(0)\n</script>\n<p>{{ n() }}</p>')
    expect(context.__stx_signals_gate).toBe(true)
  })

  it('stamps false for a template with no signals', async () => {
    // Explicitly false, not absent — absent would mean "not yet decided", and
    // the `=== undefined` guard below depends on telling those apart.
    const { context } = await render('<p>static</p>')
    expect(context.__stx_signals_gate).toBe(false)
  })

  it('does not overwrite a gate an outer render already decided', async () => {
    // A component stamps on its PRE-strip source; the recursive call on the
    // stripped body must not clobber that with a weaker answer.
    const context: Record<string, any> = { __stx_signals_gate: true }
    await processDirectives('<p>no signals here</p>', context, path.join(dir, 'page.stx'), options(), new Set<string>())
    expect(context.__stx_signals_gate).toBe(true)
  })
})

describe('gate scoping across render units', () => {
  it('preserves a partial signal expression outside a loop', async () => {
    const { out } = await render('<div>@include("chip")</div>')
    expect(out).toContain('{{ label() }}')
  })

  it('preserves a partial signal expression once per loop iteration', async () => {
    const { out } = await render(`@foreach(['a', 'b'] as $item)
<div>@include("chip")</div>
@endforeach`)
    expect(out.match(/\{\{ label\(\) \}\}/g)).toHaveLength(2)
  })

  it('still bakes a signal-free partial inside a loop', async () => {
    // Widen-only must not mean widen-everything.
    const { out } = await render(`@foreach(['a'] as $item)
<div>@include("plain")</div>
@endforeach`)
    expect(out).not.toContain('{{ mystery }}')
  })

  it('does not leak a page gate down into a signal-free partial', async () => {
    // The include stamp is a plain assignment, so it RE-SCOPES to the partial
    // rather than inheriting the page's answer. If it leaked, this partial's
    // expression would be preserved and the user would see literal {{ }}.
    const { out } = await render(`<script client>
const n = state(0)
</script>
<div>@include("plain")</div>`)
    expect(out).not.toContain('{{ mystery }}')
  })
})

/**
 * The cases each retired override used to carry.
 *
 * Before removing any of them, each needed a test naming the case it protected —
 * they had none, which is why a green suite could not tell "safe to delete" from
 * "untested". These are those tests.
 */
describe('cases the per-caller overrides used to carry', () => {
  it('preserves slot content authored by the CALLER', async () => {
    // options.__stx_force_signals existed for this: `<Alert>{{ error }}</Alert>`
    // is written by the caller, so judging it by the COMPONENT's own script
    // rendered it as an empty styled box.
    const { out } = await render(`<script client>
const error = state('boom')
</script>
<Alert>{{ error() }}</Alert>`)
    expect(out).toContain('{{ error() }}')
  })

  it('keeps a signal alive when a static prop of the same name shadows it', async () => {
    // This is the case the client-signal NAME SET protects, which is a
    // different thing from the gate boolean — the Set drives the
    // firstVarIsClientSignal early-returns. Deleting the gate term is safe;
    // emptying the Set is not.
    const { out } = await render(`<script client>
const title = state('SIGNAL')
</script>
<div>{{ title() }}</div>`)
    expect(out).toContain('{{ title() }}')
  })
})
