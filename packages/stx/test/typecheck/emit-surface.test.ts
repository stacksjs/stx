/**
 * `defineEmits` accepts both documented forms, and `emit` forwards every argument.
 *
 * `stx.d.ts` is the ambient set for `<script client>`, so its `defineEmits` is
 * the only one an author can see. It declared a single union form with one
 * optional payload:
 *
 *   declare function defineEmits<T extends string = string>(): (_event: T, _payload?: unknown) => void
 *
 * That contradicted the runtime on two counts. The map form - the one
 * `composition-api.ts` implements, the one the JSDoc on both implementations
 * shows, and the one every dashboard table is written in - was a constraint
 * violation, because an object type is not a `string`. And a third argument was
 * an arity error even though the runtime forwards its whole argument list, so
 * `emit('change', id, tab)` failed to typecheck against a call that works.
 *
 * `authoring-surface.test.ts` pins the declaration set as a whole. This file
 * pins what an author experiences at the call site, which is a different
 * failure: a declaration can be present and still describe the wrong function.
 */

import { afterAll, describe, expect, it } from 'bun:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { typecheckStxFiles } from '../../src/typecheck'
import { allowForATypeScriptProgram } from '../../test-utils/checker-timeout'

allowForATypeScriptProgram()

const dir = join(tmpdir(), `stx-emit-${crypto.randomUUID()}`)

afterAll(async () => {
  await Bun.$`rm -rf ${dir}`.quiet().catch(() => {})
})

async function check(name: string, script: string) {
  const file = join(dir, name)
  await Bun.write(file, `<script client>\n${script}\n</script>\n<main>x</main>`)
  return typecheckStxFiles([file], { templates: false })
}

describe('the union form', () => {
  it('accepts a declared event with no payload', async () => {
    const result = await check('union-bare.stx', [
      `const emit = defineEmits<'change' | 'close'>()`,
      `emit('close')`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })

  it('accepts more than one payload argument', async () => {
    const result = await check('union-variadic.stx', [
      `const emit = defineEmits<'change'>()`,
      `emit('change', 1, { id: 2 })`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })

  it('still rejects an event outside the union', async () => {
    const result = await check('union-unknown.stx', [
      `const emit = defineEmits<'change'>()`,
      `emit('nope')`,
    ].join('\n'))

    expect(result.diagnostics.length).toBeGreaterThan(0)
  })
})

describe('the map form', () => {
  it('accepts an event map and a matching payload', async () => {
    const result = await check('map-ok.stx', [
      `interface Row { id: number }`,
      `const emit = defineEmits<{ view: [record: Row], remove: [id: number] }>()`,
      `emit('view', { id: 1 })`,
      `emit('remove', 2)`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })

  it('rejects a payload of the wrong type', async () => {
    const result = await check('map-wrong-payload.stx', [
      `const emit = defineEmits<{ remove: [id: number] }>()`,
      `emit('remove', 'two')`,
    ].join('\n'))

    expect(result.diagnostics.length).toBeGreaterThan(0)
  })

  it('rejects a missing payload', async () => {
    const result = await check('map-missing-payload.stx', [
      `const emit = defineEmits<{ remove: [id: number] }>()`,
      `emit('remove')`,
    ].join('\n'))

    expect(result.diagnostics.length).toBeGreaterThan(0)
  })

  it('rejects an event the map does not declare', async () => {
    const result = await check('map-unknown.stx', [
      `const emit = defineEmits<{ remove: [id: number] }>()`,
      `emit('view', 1)`,
    ].join('\n'))

    expect(result.diagnostics.length).toBeGreaterThan(0)
  })
})

describe('no type argument', () => {
  it('still accepts any event name', async () => {
    const result = await check('bare.stx', [
      `const emit = defineEmits()`,
      `emit('anything', 1, 2, 3)`,
    ].join('\n'))

    expect(result.diagnostics).toEqual([])
  })
})
