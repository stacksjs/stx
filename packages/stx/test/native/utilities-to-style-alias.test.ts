/**
 * `headwind-to-style` was renamed `utilities-to-style`; the old path stays as
 * a deprecated re-export so deep imports keep working. It must stay the same
 * module, not a copy that drifts.
 */
import { expect, it } from 'bun:test'
import * as deprecated from '../../src/native/compiler/headwind-to-style'
import * as current from '../../src/native/compiler/utilities-to-style'

it('re-exports every name of utilities-to-style, as the same values', () => {
  expect(Object.keys(deprecated).sort()).toEqual(Object.keys(current).sort())
  for (const name of Object.keys(current))
    expect((deprecated as Record<string, unknown>)[name]).toBe((current as Record<string, unknown>)[name])
  expect(typeof current.compileHeadwindToStyle).toBe('function')
})
