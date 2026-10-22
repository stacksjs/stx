import { state } from '@stacksjs/stx'

// A reactivity/ownership fixture, not a substitute for game simulation rules.
export const count = state(0)
export const error = state('')
export const rows = state([{ id: 'a', draft: '' }, { id: 'b', draft: '' }])
const subscribers = new Set<(value: number) => void>()
export const subscriberCount = () => subscribers.size
export function subscribe(callback: (value: number) => void) {
  subscribers.add(callback)
  return () => { subscribers.delete(callback) }
}
export function increment(amount: unknown) {
  if (typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount <= 0) {
    error.set('Invalid amount')
    return false
  }
  count.set(count() + amount)
  error.set('')
  subscribers.forEach(callback => callback(count()))
  return true
}
export function edit(id: string, draft: string) {
  rows.set(rows().map(row => row.id === id ? { ...row, draft } : row))
}
export function reorder() { rows.set([...rows()].reverse()) }
