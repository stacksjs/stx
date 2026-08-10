/**
 * `__stxServeContext` is declared for every server script, not only a page's.
 *
 * A server script's scope is built from the keys of whatever context its caller
 * assembled, so a key the caller never set is not declared at all — and an
 * *undeclared* identifier is a ReferenceError, which optional chaining does not
 * save. `__stxServeContext?.cookies` throws before the chain is reached.
 *
 * It throws inside the script's IIFE, so it takes every other binding in the
 * file down with it. `render.ts` defaults the binding for a page render, and
 * that looked sufficient — but the component renderer builds its own context,
 * which has never carried the key, so every `<CsrfField />` and every badge
 * fell back to static extraction on the boot a production server and an e2e
 * suite both use, while a page naming the same binding worked.
 *
 * ## Why this needs execution-dependent values to test at all
 *
 * The static fallback is good. When the IIFE dies, a regex pass still recovers
 * `const title = 'x'`, `['a','b'].join('-')`, even `a ?? '/fallback'` — so a
 * template built from literals renders identically whether or not the script
 * ran. That is what made the bug survive: the failure is invisible until a
 * binding needs the script to have actually executed, such as one calling a
 * function the same block declared.
 *
 * A first version of this file asserted on literals and passed with the fix
 * REMOVED, which is worth recording — a test for a silent bug can be silent
 * in the same way.
 *
 * Fixed in fd0e239955, which shipped with no test: removing it left all 9713
 * tests in `packages/stx` and `packages/bun-plugin` passing.
 */

import { describe, expect, it } from 'bun:test'
import { extractVariables } from '../../src/variable-extractor'

const FILE = `${import.meta.dir}/serve-context-declared.stx`

describe('a server script naming __stxServeContext', () => {
  it('still runs, so a binding that needs execution survives', async () => {
    // The discriminating case. `greet('bob')` cannot be recovered statically —
    // it needs the IIFE to have run — so this is empty when the ReferenceError
    // takes the block down.
    const context: Record<string, unknown> = {}

    await extractVariables(
      `const token = __stxServeContext?.csrfToken ?? ''
function greet(name) { return \`hi \${name}\` }
const out = greet('bob')`,
      context,
      FILE,
    )

    expect(context.out).toBe('hi bob')
    expect(context.token).toBe('')
  })

  it('survives a component-shaped context that carries only props', async () => {
    /*
     * The context the component renderer builds: props and nothing else. This
     * is the exact shape that failed, because a page's context is assembled
     * somewhere that had already defaulted the key.
     */
    const context: Record<string, unknown> = { label: 'Submit', variant: 'primary' }

    await extractVariables(
      `const token = __stxServeContext?.csrfToken ?? ''
function field(value) { return \`<input value="\${value}">\` }
const rendered = field(token || 'none')`,
      context,
      FILE,
    )

    expect(context.rendered).toBe('<input value="none">')
  })

  it('reads a real serve context when the caller sets one', async () => {
    // The default must not shadow a real request. This is the page path, which
    // already worked and has to keep working.
    const context: Record<string, unknown> = {
      __stxServeContext: { csrfToken: 'tok-123' },
    }

    await extractVariables(
      `const token = __stxServeContext?.csrfToken ?? ''
function field(value) { return \`<input value="\${value}">\` }
const rendered = field(token)`,
      context,
      FILE,
    )

    expect(context.rendered).toBe('<input value="tok-123">')
  })

  it('does not invent a value for a context that was never provided', async () => {
    const context: Record<string, unknown> = {}

    await extractVariables(`const ctx = __stxServeContext`, context, FILE)

    expect(context.ctx).toBeUndefined()
  })
})
