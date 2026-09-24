import type { Signal } from './signals-api'
import { defineEmits, getCurrentInstance } from './composition-api'
import { effect, isDerived, isSignal, onDestroy, state } from './signals-api'

export type ModelModifiers = Readonly<Record<string, boolean>>

export interface ModelOptions<T> {
  default?: T
  parse?: (value: string) => T
  get?: (value: T) => T
  set?: (value: T, modifiers: ModelModifiers) => T
}

export interface ModelSignal<T> extends Signal<T> {
  readonly modifiers: ModelModifiers
  /** Input-event write; deferred when the parent supplied .lazy. */
  input(value: T): void
  /** Change-event write; used only when the parent supplied .lazy. */
  change(value: T): void
}

/**
 * Shared by module imports and the generated browser runtime. Keep this
 * function closure-free: the runtime embeds its JavaScript source, with all
 * reactive and lifecycle dependencies supplied explicitly.
 */
export function createModelSignal<T>(
  source: Signal<T>,
  modifiers: () => ModelModifiers,
  emit: (value: T) => void,
  options: ModelOptions<T>,
  cleanup: (fn: () => void) => void,
): ModelSignal<T> {
  let active = true
  const subscriptions = new Set<() => void>()
  const read = (value: T): T => options.get ? options.get(value) : value
  const model = (() => read(source())) as ModelSignal<T>
  Object.defineProperty(model, '_isSignal', { value: true })
  Object.defineProperty(model, 'modifiers', { get: modifiers })
  model.set = (value) => {
    if (!active)
      return
    const flags = modifiers()
    let next: unknown = options.set ? options.set(value, flags) : value
    if (flags.trim && typeof next === 'string')
      next = next.trim()
    if (flags.number && typeof next === 'string' && next !== '') {
      const number = Number(next)
      if (!Number.isNaN(number))
        next = number
    }
    if (Object.is(source(), next))
      return
    source.set(next as T)
    emit(next as T)
  }
  model.update = fn => model.set(fn(model()))
  model.input = value => { if (!modifiers().lazy) model.set(value) }
  model.change = value => { if (modifiers().lazy) model.set(value) }
  model.subscribe = (callback) => {
    if (!active)
      return () => {}
    const unsubscribe = source.subscribe((value, previous) => callback(read(value), read(previous)))
    subscriptions.add(unsubscribe)
    return () => { unsubscribe(); subscriptions.delete(unsubscribe) }
  }
  Object.defineProperty(model, 'value', { get: model, set: model.set })
  cleanup(() => {
    active = false
    subscriptions.forEach(unsubscribe => unsubscribe())
    subscriptions.clear()
  })
  return model
}

export function useModel<T>(options: ModelOptions<T> & { default: T }): ModelSignal<T>
export function useModel<T>(name: string, options: ModelOptions<T> & { default: T }): ModelSignal<T>
export function useModel<T = unknown>(name?: string, options?: ModelOptions<T>): ModelSignal<T | undefined>
export function useModel<T = unknown>(options?: ModelOptions<T>): ModelSignal<T | undefined>
export function useModel<T = unknown>(nameOrOptions: string | ModelOptions<T> = 'modelValue', options: ModelOptions<T> = {}): ModelSignal<T | undefined> {
  const name = typeof nameOrOptions === 'string' ? nameOrOptions : 'modelValue'
  const opts = typeof nameOrOptions === 'string' ? options : nameOrOptions
  const props = getCurrentInstance()?.props || {}
  const emit = defineEmits([`update:${name}`])
  const modifierName = name === 'modelValue' ? 'modelModifiers' : `${name}Modifiers`
  const readProp = (key: string) => isSignal(props[key]) || isDerived(props[key]) ? props[key]() : props[key]
  const source = state<T | undefined>(opts.default)
  const stop = effect(() => {
    const value = readProp(name)
    source.set(value === undefined ? opts.default : value as T)
  })
  onDestroy(stop)
  return createModelSignal(source, () => (readProp(modifierName) || {}) as ModelModifiers,
    value => emit(`update:${name}`, value), opts as ModelOptions<T | undefined>, onDestroy)
}
