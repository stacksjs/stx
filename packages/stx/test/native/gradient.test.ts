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
