/**
 * Linear gradients on native screens: `bg-gradient-to-br from-blue-600
 * to-indigo-700`. A native style had no gradient, so a store cover or a hero
 * painted with one came out with no background at all.
 */
import { describe, expect, it } from 'bun:test'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'

describe('gradient classes', () => {
  it('compile the direction and the stops, whatever their order', () => {
    expect(compileClassStyles('to-indigo-700 bg-gradient-to-br from-blue-600').style).toMatchObject({
      gradientDirection: 'to-br', gradientFrom: '#2563eb', gradientTo: '#4338ca',
    })
    expect(compileClassStyles('bg-linear-to-r from-white via-emerald-500/50 to-transparent').style).toMatchObject({
      gradientDirection: 'to-r', gradientFrom: '#ffffff', gradientVia: '#10b98180', gradientTo: 'transparent',
    })
  })

  it('keep a dark stop apart, like any other colour', () => {
    expect(compileClassStyles('bg-gradient-to-b from-slate-50 dark:from-slate-900 to-white').dark).toEqual({ gradientFrom: '#0f172a' })
  })

  it('leave classes that only start alike alone', () => {
    expect(compileClassStyles('top-0 tracking-wide').style).not.toHaveProperty('gradientTo')
  })

  it('reach the node through the translator', async () => {
    const { root } = await translateHtmlToIR('<div class="bg-gradient-to-br from-amber-500 to-orange-600 h-20"><span>cover</span></div>')
    expect(root.style).toMatchObject({ gradientDirection: 'to-br', gradientFrom: '#f59e0b', gradientTo: '#ea580c' })
  })
})

describe('pointer hosts', () => {
  it('keep hover and active classes as layers, and a transition as its duration', () => {
    const compiled = compileClassStyles('bg-white/0 hover:bg-white/50 active:opacity-80 transition duration-200 rounded-lg', undefined, { pointer: true })
    expect(compiled.style).toMatchObject({ transitionDuration: 200, borderRadius: 8 })
    expect(compiled.pointer?.hover?.style).toMatchObject({ backgroundColor: expect.any(String) })
    expect(compiled.pointer?.active?.style).toMatchObject({ opacity: 0.8 })
    expect(compiled.unknown).toEqual([])
  })

  it('give a transition alone 150ms, and keep a dark hover apart', () => {
    const compiled = compileClassStyles('transition hover:bg-slate-100 dark:hover:bg-slate-800', undefined, { pointer: true })
    expect(compiled.style.transitionDuration).toBe(150)
    expect(compiled.pointer?.hover?.style).toMatchObject({ backgroundColor: '#f1f5f9' })
  })

  it('leave phones as they were: no hover layer, no duration', () => {
    const compiled = compileClassStyles('hover:bg-white/50 transition duration-200', undefined, {})
    expect(compiled.pointer).toBeUndefined()
    expect(compiled.style).not.toHaveProperty('transitionDuration')
    expect(compiled.unknown).toEqual([])
  })
})
