/**
 * `useEventListener` is typed the way it is implemented (stacksjs/stx#1923).
 *
 * The runtime has always been event-first, with the target carried on the
 * options object:
 *
 *     function useEventListener(event, handler, options) {
 *       var target = (options && options.target) || window
 *
 * The ambient declaration said target-first, and the two disagreed in the worst
 * possible direction. `_target` accepted `string`, so the CORRECT call got as
 * far as reading `'keydown'` as a selector before failing on the handler — and
 * an author who trusted the type and added a target wrote
 * `useEventListener(window, 'keydown', fn)`, which binds an event named
 * "window" with the string `'keydown'` as its handler and silently attaches
 * nothing. Working code was rejected; broken code was accepted.
 *
 * `browser-composables.ts` had it right all along, so the package shipped two
 * declarations of one name with different arities and the registry got the
 * wrong one.
 *
 * Both directions are pinned, because fixing only the first would leave the
 * silent-no-op call type-checking.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'

const dir = join(tmpdir(), `stx-uel-${crypto.randomUUID()}`)

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

async function check(name: string, script: string): Promise<Awaited<ReturnType<typeof typecheckStxFiles>>> {
  const file = join(dir, name)
  await Bun.write(file, `<script client>\n${script}\n</script>\n<main>x</main>`)
  return typecheckStxFiles([file], { templates: false })
}

describe('the call that works', () => {
  it('type-checks with two arguments', async () => {
    // The shape a real app's keyboard-shortcut block uses. This was TS2769.
    const result = await check('two-args.stx', `useEventListener('keydown', (event) => { console.log(event.key) })`)

    expect(result.diagnostics).toHaveLength(0)
  })

  it('type-checks with options, including the target', async () => {
    const result = await check('options.stx', [
      `useEventListener('scroll', () => {}, { passive: true })`,
      `useEventListener('click', () => {}, { target: '#panel', once: true })`,
      `useEventListener('resize', () => {}, { target: window, capture: true })`,
    ].join('\n'))

    expect(result.diagnostics).toHaveLength(0)
  })

  it('infers the event type from the event name', async () => {
    // Proves the declaration is really in play rather than degrading to `any` —
    // an `any` signature would accept everything and pin nothing.
    const result = await check('inferred.stx', `useEventListener('keydown', (event) => { console.log(event.nosuchproperty) })`)

    expect(result.diagnostics.map(d => d.code)).toContain(2339)
  })
})

describe('the call that silently binds nothing', () => {
  it('is rejected', async () => {
    // `useEventListener(window, 'keydown', fn)` registers an event named
    // "window" whose handler is the string 'keydown'. It runs, attaches
    // nothing, and reports no error at runtime — so the type is the only thing
    // that can catch it.
    const result = await check('target-first.stx', `useEventListener(window, 'keydown', (event: KeyboardEvent) => {})`)

    expect(result.diagnostics.map(d => d.code)).toContain(2769)
  })
})

describe('the two declarations of this name', () => {
  it('agree with each other', async () => {
    /*
     * `browser-composables.ts` exports it for module import; `stx.d.ts` declares
     * it as a runtime global. One name, two files, and the drift between them is
     * what #1923 was. Compared structurally rather than textually: what matters
     * is that neither leads with a target.
     */
    const ambient = await Bun.file(`${import.meta.dir}/../../stx.d.ts`).text()
    const composable = await Bun.file(`${import.meta.dir}/../../src/browser-composables.ts`).text()

    const firstParam = (source: string, decl: RegExp): string => {
      const at = source.search(decl)
      expect(at).toBeGreaterThan(-1)
      return source.slice(at).split('\n')[1].trim()
    }

    expect(firstParam(ambient, /declare function useEventListener</)).toMatch(/^_event:/)
    expect(firstParam(composable, /export function useEventListener</)).toMatch(/^event:/)
  })
})
