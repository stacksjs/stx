/**
 * Verifies that defineProps / withDefaults / friends are reachable
 * from the public `stx` entry, not only `stx/props` (stacksjs/stx#1740).
 *
 * Before this fix, the props module was commented out of `src/index.ts`
 * because of an overlapping `PropType` name with `./types`. Editors
 * couldn't resolve `import { defineProps } from 'stx'` even though the
 * test suite (issue-fixes.test.ts:507) and docs both assumed it was
 * the canonical import path.
 */
import { describe, expect, it } from 'bun:test'
import * as stx from '../../src/index'

describe('stacksjs/stx#1740 — public defineProps export surface', () => {
  it('exposes defineProps from the main entry', () => {
    expect(typeof stx.defineProps).toBe('function')
  })

  it('exposes withDefaults from the main entry', () => {
    expect(typeof stx.withDefaults).toBe('function')
  })

  it('exposes definePropsWithValidation from the main entry', () => {
    expect(typeof stx.definePropsWithValidation).toBe('function')
  })

  it('exposes processComponentProps from the main entry', () => {
    expect(typeof stx.processComponentProps).toBe('function')
  })

  it('exposes the helper constructors (prop / required / optional / validated)', () => {
    expect(typeof stx.prop).toBe('function')
    expect(typeof stx.required).toBe('function')
    expect(typeof stx.optional).toBe('function')
    expect(typeof stx.validated).toBe('function')
  })

  it('exposes the constraint helpers (oneOf / arrayOf / shape)', () => {
    expect(typeof stx.oneOf).toBe('function')
    expect(typeof stx.arrayOf).toBe('function')
    expect(typeof stx.shape).toBe('function')
  })

  it('keeps the canonical defineEmits from composition-api (not the dead duplicate in props.ts)', () => {
    // defineEmits is exported from composition-api in index.ts. The props.ts
    // duplicate is deliberately *not* re-exported here to avoid signature
    // mismatch — the composition-api flavor is the documented one.
    expect(typeof stx.defineEmits).toBe('function')
  })

  it('the runtime defineProps reads from __STX_CURRENT_PROPS__', () => {
    const prev = (globalThis as Record<string, unknown>).__STX_CURRENT_PROPS__
    ;(globalThis as Record<string, unknown>).__STX_CURRENT_PROPS__ = {
      title: 'Hello',
      count: 5,
    }
    const props = stx.defineProps<{ title: string, count: number, fallback?: string }>({
      fallback: { default: '/images/default.svg' },
    })
    expect(props.title).toBe('Hello')
    expect(props.count).toBe(5)
    expect(props.fallback).toBe('/images/default.svg')
    ;(globalThis as Record<string, unknown>).__STX_CURRENT_PROPS__ = prev
  })

  it('withDefaults merges defaults non-destructively', () => {
    const prev = (globalThis as Record<string, unknown>).__STX_CURRENT_PROPS__
    ;(globalThis as Record<string, unknown>).__STX_CURRENT_PROPS__ = { variant: 'primary' }
    const props = stx.withDefaults(
      stx.defineProps<{ variant?: string, size?: string }>(),
      { variant: 'secondary', size: 'md' },
    )
    expect(props.variant).toBe('primary')
    expect(props.size).toBe('md')
    ;(globalThis as Record<string, unknown>).__STX_CURRENT_PROPS__ = prev
  })

  it('exposes the prop-options type aliases for editor autocomplete', () => {
    // Compile-time check — if these types weren't exported, this file
    // wouldn't typecheck. The runtime expect is incidental.
    const opts: stx.PropOptions<string> = { required: true, default: 'x' }
    expect(opts.required).toBe(true)
  })
})
