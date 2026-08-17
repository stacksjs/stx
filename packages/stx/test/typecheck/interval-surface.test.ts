/**
 * The `useInterval` a client script can call is the one that exists (stacksjs/stx#1941).
 *
 * `stx.d.ts` is the ambient set for `<script client>`, so whatever it declares
 * is the only `useInterval` an author can see. It declared
 * `(fn, ms, options) => { start, stop, isActive }`, which nothing implements.
 * The reporter's snippet passed `stx typecheck` with 0 errors and threw
 * `poll.start is not a function` on mount — the types pointed at the broken call
 * and away from the working one.
 *
 * `timer-declaration-drift.test.ts` pins the declaration against the runtime
 * source. This file pins what an author experiences: the phantom call is now
 * rejected, and both real call forms are accepted. Those are different failures
 * — a declaration could match the runtime and still be unusable from a script.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'

const dir = join(tmpdir(), `stx-interval-${crypto.randomUUID()}`)

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

async function check(name: string, script: string) {
  const file = join(dir, name)
  await Bun.write(file, `<script client>\n${script}\n</script>\n<main>x</main>`)
  return typecheckStxFiles([file], { templates: false })
}

describe('the snippet from the report', () => {
  it('no longer typechecks, because `start` does not exist', async () => {
    const result = await check('phantom.stx', [
      `const poll = useInterval(() => {}, 60_000, { immediate: false })`,
      `poll.start()`,
    ].join('\n'))

    expect(result.diagnostics.length).toBeGreaterThan(0)
    // Named, so the failure explains itself rather than just counting errors.
    expect(result.diagnostics.map(d => d.message).join('\n')).toContain('start')
  })
})

describe('the call forms that do exist', () => {
  it('accepts the counter form', async () => {
    const result = await check('counter.stx', [
      `const t = useInterval(1000)`,
      `const n: number = t.counter`,
      `t.pause(); t.resume(); t.reset()`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })

  it('accepts the callback form the runtime branches on', async () => {
    const result = await check('callback.stx', [
      `const poll = useInterval(() => {}, 60_000)`,
      `poll.pause()`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })

  it('accepts a callback with an options object and no delay', async () => {
    const result = await check('cb-opts.stx', [
      `const poll = useInterval(() => {}, { enabled: false, whileVisible: true })`,
      `poll.resume()`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })

  it('accepts subscribe, which is how you react to a tick', async () => {
    // `counter` is a plain number, so an effect cannot track it. If subscribe
    // were undeclared there would be no supported way to observe the timer.
    const result = await check('subscribe.stx', [
      `const t = useInterval(1000)`,
      `const off = t.subscribe((count) => { void count })`,
      `off()`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })
})

describe('the declaration still enforces something', () => {
  it('rejects an unknown option', async () => {
    // Without this, `options?: any` would satisfy every test above while
    // checking nothing.
    const result = await check('typo.stx', `useInterval(1000, { imediate: true })`)

    expect(result.diagnostics.length).toBeGreaterThan(0)
  })

  it('rejects treating counter as a signal', async () => {
    // The shape most likely to be assumed, and the one the old declaration
    // encouraged. It is a number.
    const result = await check('counter-call.stx', [
      `const t = useInterval(1000)`,
      `const n: number = t.counter()`,
    ].join('\n'))

    expect(result.diagnostics.length).toBeGreaterThan(0)
  })
})
