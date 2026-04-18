import { defineStore } from 'stx'

export const useFavorites = defineStore('favorites', () => {
  const ids = state<string[]>([])

  const count = derived(() => ids().length)

  function toggle(id: string) {
    const list = ids()
    if (list.includes(id)) {
      ids.set(list.filter(x => x !== id))
    }
    else {
      ids.set([...list, id])
    }
  }

  function has(id: string): boolean {
    return ids().includes(id)
  }

  function clear() {
    ids.set([])
  }

  return { ids, count, toggle, has, clear }
}, {
  persist: { pick: ['ids'], key: 'drivly-favorites' },
})
