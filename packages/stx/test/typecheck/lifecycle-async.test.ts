/**
 * `onMount(async () => …)` typechecks, and a rejection is reported.
 *
 * Fetching initial data in `onMount` is the documented pattern - it is the
 * second JSDoc example on both `onMount` implementations. But `LifecycleHook`
 * in `composables.ts` was `() => void | (() => void)`, with no promise in the
 * return union, so every async `onMount` in a real app was a type error
 * against an API that ran it correctly.
 *
 * Only a *synchronous* return can be a cleanup function, since the runtime
 * registers it before the next hook runs. A promise therefore resolves to
 * `void`, and the runners now attach a `catch` to it: an async hook throws
 * after the synchronous call has already returned, so the `try/catch` around
 * the call never saw it and the failure surfaced as an unhandled rejection
 * with nothing naming the hook.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createComponentInstance, mountComponent, onMount, setCurrentInstance } from '../../src/composables'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

const dir = join(tmpdir(), `stx-lifecycle-${crypto.randomUUID()}`)

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

async function check(name: string, script: string) {
  const file = join(dir, name)
  await Bun.write(file, `<script client>\n${script}\n</script>\n<main>x</main>`)
  return typecheckStxFiles([file], { templates: false })
}

describe('the declaration', () => {
  it('accepts an async hook', async () => {
    const result = await check('async.stx', [
      `const data = state<number | null>(null)`,
      `onMount(async () => { data.set(await Promise.resolve(1)) })`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })

  it('accepts an async function passed by reference', async () => {
    const result = await check('async-ref.stx', [
      `async function load(): Promise<void> {}`,
      `onMount(load)`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })

  it('still accepts a synchronous cleanup return', async () => {
    const result = await check('cleanup.stx', [
      `onMount(() => { const id = setInterval(() => {}, 1000); return () => clearInterval(id) })`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })
})

describe('a rejecting async hook', () => {
  it('is logged rather than left as an unhandled rejection', async () => {
    const instance = createComponentInstance('async-throw')
    setCurrentInstance(instance)
    onMount(async () => {
      throw new Error('boom')
    })
    setCurrentInstance(null)

    const errors: unknown[][] = []
    const original = console.error
    console.error = (...args: unknown[]) => { errors.push(args) }
    try {
      mountComponent(instance)
      // The catch is attached synchronously; the rejection lands a microtask later.
      await Promise.resolve()
      await Promise.resolve()
    }
    finally {
      console.error = original
    }

    expect(errors.length).toBe(1)
    expect(String(errors[0]?.[1])).toContain('boom')
  })
})
