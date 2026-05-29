/**
 * Typed component contracts — defineProps / withDefaults / defineEmits /
 * defineSlots (stacksjs/stx#1740).
 *
 * The headline correctness win the issue calls out (point 4): a prop default
 * must apply ONLY when the prop is `undefined`. A passed-in `0` / `false` / `''`
 * is a real value and must never be collapsed into the default. This is the
 * `=== undefined` guard, and it has to hold identically across all THREE
 * impls that exist in the codebase:
 *   - module          → src/props.ts (import path; tests, SSR helpers)
 *   - server sandbox  → src/variable-extractor.ts (<script server> runtime)
 *   - client runtime  → src/signals.ts (window.stx, generated template literal)
 *
 * If these drift, a component renders different defaults on the server vs the
 * client — the worst kind of hydration bug. These tests pin all three.
 */
import { describe, expect, it } from 'bun:test'
import { defineProps as moduleDefineProps, withDefaults as moduleWithDefaults } from '../../src/props'
import { defineSlots as moduleDefineSlots } from '../../src/composition-api'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { extractVariables } from '../../src/variable-extractor'

describe('typed contracts: non-collapsing defaults (#1740)', () => {
  describe('module impl (src/props.ts)', () => {
    it('defineProps keeps a passed falsy value over the default', () => {
      const prev = (globalThis as any).__STX_CURRENT_PROPS__
      ;(globalThis as any).__STX_CURRENT_PROPS__ = { count: 0, flag: false, label: '' }
      try {
        const props = moduleDefineProps({
          count: { default: 99 },
          flag: { default: true },
          label: { default: 'fallback' },
          missing: { default: 'used' },
        })
        expect(props.count).toBe(0)
        expect(props.flag).toBe(false)
        expect(props.label).toBe('')
        expect(props.missing).toBe('used') // only undefined gets the default
      }
      finally {
        ;(globalThis as any).__STX_CURRENT_PROPS__ = prev
      }
    })

    it('withDefaults keeps a passed falsy value over the default', () => {
      const props = moduleWithDefaults(
        { count: 0, flag: false, label: '', missing: undefined } as Record<string, unknown>,
        { count: 99, flag: true, label: 'fallback', missing: 'used' },
      )
      expect(props.count).toBe(0)
      expect(props.flag).toBe(false)
      expect(props.label).toBe('')
      expect(props.missing).toBe('used')
    })
  })

  describe('server sandbox (src/variable-extractor.ts)', () => {
    it('defineProps(options) applies defaults only when undefined', async () => {
      const context: Record<string, unknown> = { props: { count: 0, flag: false } }
      await extractVariables(
        `const resolved = defineProps({
          count: { default: 99 },
          flag: { default: true },
          missing: { default: 'used' },
        })`,
        context,
        'test.stx',
      )
      const resolved = context.resolved as Record<string, unknown>
      expect(resolved.count).toBe(0)
      expect(resolved.flag).toBe(false)
      expect(resolved.missing).toBe('used')
    })

    it('withDefaults(defineProps(), {...}) keeps passed falsy values', async () => {
      const context: Record<string, unknown> = { props: { count: 0, label: '' } }
      await extractVariables(
        `const resolved = withDefaults(defineProps(), {
          count: 99,
          label: 'fallback',
          missing: 'used',
        })`,
        context,
        'test.stx',
      )
      const resolved = context.resolved as Record<string, unknown>
      expect(resolved.count).toBe(0)
      expect(resolved.label).toBe('')
      expect(resolved.missing).toBe('used')
    })
  })

  describe('client runtime (src/signals.ts)', () => {
    it('runtime defineProps + withDefaults both guard on === undefined', () => {
      const runtime = generateSignalsRuntimeDev()
      // Both runtime impls must gate the default behind an undefined check —
      // never a truthiness check (which would collapse 0/false/'').
      expect(runtime).toContain('if (result[key] === undefined && opts[\'default\'] !== undefined)')
      expect(runtime).toContain('if (result[key] === undefined)')
    })
  })
})

describe('typed contracts: defineSlots (#1740)', () => {
  it('module defineSlots returns an object (live slots, empty without an instance)', () => {
    const slots = moduleDefineSlots()
    expect(typeof slots).toBe('object')
    expect(slots).toEqual({})
  })

  it('server sandbox exposes defineSlots returning the slots map', async () => {
    const context: Record<string, unknown> = { slots: { default: () => 'x', header: () => 'h' } }
    await extractVariables(
      `const s = defineSlots()
       const slotNames = Object.keys(s).sort().join(',')`,
      context,
      'test.stx',
    )
    expect(context.slotNames).toBe('default,header')
  })

  it('client runtime exposes window.stx.defineSlots', () => {
    expect(generateSignalsRuntimeDev()).toContain('defineSlots: function()')
  })

  it('the generics-strip keeps defineSlots<T>() callable after TS removal', async () => {
    const context: Record<string, unknown> = { slots: { default: () => 'x' } }
    await extractVariables(
      `interface Slots { default: () => unknown }
       const s = defineSlots<Slots>()
       const has = ('default' in s)`,
      context,
      'test.stx',
    )
    expect(context.has).toBe(true)
  })
})
