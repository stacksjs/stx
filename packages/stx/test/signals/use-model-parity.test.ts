import { afterEach, beforeAll, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { useModel } from '../../src/component-model'
import { createComponentInstance, resetComponentState, setCurrentInstance } from '../../src/composition-api'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { runDestroyCallbacks, state } from '../../src/signals-api'
import { installNodeConstants } from '../../test-utils/dom-runtime-shim'

declare const window: any
declare const document: any

const flush = () => new Promise(resolve => setTimeout(resolve, 10))
let seq = 0

beforeAll(() => {
  installNodeConstants()
  new Function(generateSignalsRuntimeDev())()
  globalThis.MutationObserver = window.MutationObserver
})

afterEach(() => {
  runDestroyCallbacks()
  resetComponentState()
  window.__STX_CURRENT_ELEMENT__ = null
  window.stx._cleanupContainer(document.body)
  document.body.innerHTML = ''
})

it('keeps the shared model factory executable after bundling and minification', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'stx-model-bundle-'))
  try {
    const result = await Bun.build({
      entrypoints: [resolve(import.meta.dir, '../../src/signals.ts')],
      outdir: dir, target: 'bun', minify: true,
    })
    expect(result.success).toBe(true)
    const bundled = await import(join(dir, 'signals.js'))
    new Function(bundled.generateSignalsRuntime())()
    const model = window.stx.useModel({ default: 1 })
    model.set(2)
    expect(model()).toBe(2)
  }
  finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

for (const runtime of [false, true]) {
  describe(`useModel: ${runtime ? 'browser' : 'module'}`, () => {
    function setup(props: Record<string, unknown> = {}) {
      const root = document.createElement('div')
      document.body.appendChild(root)
      const scopeId = `model_${++seq}`
      root.setAttribute('data-stx-scope', scopeId)
      const events: Array<[string, unknown]> = []
      const sources: Record<string, any> = {}
      for (const [key, value] of Object.entries(props)) {
        sources[key] = state(value)
        root.setAttribute(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
      }
      for (const key of ['modelValue', 'title', 'count']) {
        root.addEventListener(`update:${key}`, (event: any) => {
          events.push([key, event.detail])
          sources[key]?.set(event.detail)
        })
      }
      if (runtime) {
        window.stx._scopes[scopeId] = { __destroyCallbacks: [], __mountCallbacks: [] }
        window.__STX_CURRENT_ELEMENT__ = root
      }
      else {
        const instance = createComponentInstance()
        instance.el = root
        instance.props = sources
        setCurrentInstance(instance)
      }
      return {
        model: runtime ? window.stx.useModel : useModel,
        events,
        root,
        set(key: string, value: unknown) {
          sources[key]?.set(value)
          root.setAttribute(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
        },
        destroy() {
          if (runtime) window.stx._cleanupContainer(root)
          else runDestroyCallbacks()
          root.remove()
        },
      }
    }

    it('tracks parent changes without emitting and sends one event for a child write', async () => {
      const ctx = setup({ modelValue: 'first' })
      const model = ctx.model({ default: '' })
      expect(model()).toBe('first')
      ctx.set('modelValue', 'parent')
      await flush()
      expect(model()).toBe('parent')
      expect(ctx.events).toEqual([])
      model.set('child')
      model.set('child')
      expect(model.value).toBe('child')
      expect(ctx.events).toEqual([['modelValue', 'child']])
    })

    it('keeps named models independent and exposes signal writes and subscriptions', () => {
      const ctx = setup({ title: 'title', count: 1 })
      const title = ctx.model('title', { default: '' })
      const count = ctx.model('count', { default: 0 })
      const seen: number[] = []
      const unsubscribe = count.subscribe((value: number) => seen.push(value))
      count.update((value: number) => value + 1)
      title.value = 'new'
      expect(count()).toBe(2)
      expect(title()).toBe('new')
      expect(count._isSignal).toBe(true)
      expect(seen).toEqual([2])
      expect(ctx.events).toEqual([['count', 2], ['title', 'new']])
      unsubscribe()
      count.set(3)
      expect(seen).toEqual([2])
    })

    it('honors trim/number/lazy and passes custom modifiers to the setter', () => {
      const ctx = setup({ count: 1, countModifiers: { trim: true, number: true, lazy: true }, titleModifiers: { capitalize: true } })
      const count = ctx.model('count', { default: 0 })
      count.input(' 42 ')
      expect(count()).toBe(1)
      count.change(' 42 ')
      expect(count()).toBe(42)
      count.set('  invalid  ')
      expect(count()).toBe('invalid')
      const title = ctx.model('title', {
        default: '',
        set: (value: string, modifiers: any) => modifiers.capitalize ? value.toUpperCase() : value,
      })
      title.input('hello')
      expect(title()).toBe('HELLO')
      expect(title.modifiers).toEqual({ capitalize: true })
      expect(ctx.events).toEqual([['count', 42], ['count', 'invalid'], ['title', 'HELLO']])
    })

    it('does not emit defaults; disposes subscriptions and parent observation before remount', async () => {
      const ctx = setup({ count: 1 })
      const model = ctx.model('count', { default: 0 })
      const absent = ctx.model({ default: 'local' })
      expect(absent()).toBe('local')
      expect(ctx.events).toEqual([])
      const seen: number[] = []
      model.subscribe((value: number) => seen.push(value))
      ctx.destroy()
      ctx.set('count', 4)
      await flush()
      model.set(9)
      expect(model()).toBe(1)
      expect(seen).toEqual([])
      expect(ctx.events).toEqual([])
      const next = setup({ count: 5 })
      const remounted = next.model('count', { default: 0 })
      remounted.set(6)
      expect(remounted()).toBe(6)
      expect(next.events).toEqual([['count', 6]])
    })

    it('preserves falsy values and applies read/write transforms to subscriptions', () => {
      const ctx = setup({ count: 0 })
      const count = ctx.model('count', { default: 9, get: (n: number) => n * 2, set: (n: number) => n / 2 })
      expect(count()).toBe(0)
      const seen: unknown[] = []
      count.subscribe((value: number, previous: number) => seen.push([value, previous]))
      count.set(8)
      expect(count()).toBe(8)
      expect(seen).toEqual([[8, 0]])
      expect(ctx.events).toEqual([['count', 4]])
    })
  })
}
