import { defineStore, state } from '@stacksjs/stx'

// A store kept in localStorage, as a web app's session or preferences are.
export const counterStore = defineStore('counter', () => {
  const saved = Number(localStorage.getItem('counter.count') || 0)
  const count = state(saved)
  function increment() {
    count.set(count() + 1)
    localStorage.setItem('counter.count', String(count()))
  }
  return { count, increment }
})
