import { afterEach, describe, expect, it } from 'bun:test'
import {
  clearStores,
  createAction,
  createActions,
  createStore,
} from '../../src/state-management'

describe('createAction', () => {
  afterEach(() => {
    clearStores()
  })

  it('should create an action that updates store', async () => {
    const counter = createStore(0)
    const increment = createAction(counter, 'increment', state => state + 1)

    await increment()
    expect(counter.get()).toBe(1)

    await increment()
    expect(counter.get()).toBe(2)
  })

  it('should accept parameters', async () => {
    const counter = createStore(0)
    const add = createAction(counter, 'add', (state, amount: number) => state + amount)

    await add(5)
    expect(counter.get()).toBe(5)

    await add(3)
    expect(counter.get()).toBe(8)
  })

  it('should handle multiple parameters', async () => {
    const store = createStore({ x: 0, y: 0 })
    const setPosition = createAction(
      store,
      'setPosition',
      (_state, x: number, y: number) => ({ x, y }),
    )

    await setPosition(10, 20)
    expect(store.get()).toEqual({ x: 10, y: 20 })
  })

  it('should handle async actions', async () => {
    const store = createStore({ loading: false, data: null as string | null })

    const fetchData = createAction(
      store,
      'fetchData',
      async (_state, id: string) => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 10))
        return { loading: false, data: `Data for ${id}` }
      },
    )

    await fetchData('123')
    expect(store.get()).toEqual({ loading: false, data: 'Data for 123' })
  })
})

describe('createActions', () => {
  afterEach(() => {
    clearStores()
  })

  it('should create multiple actions', async () => {
    const counter = createStore(0)

    const actions = createActions(counter, {
      increment: state => state + 1,
      decrement: state => state - 1,
      add: (state, amount: number) => state + amount,
    })

    await actions.increment()
    expect(counter.get()).toBe(1)

    await actions.decrement()
    expect(counter.get()).toBe(0)

    await actions.add(10)
    expect(counter.get()).toBe(10)
  })

  it('should work with object stores', async () => {
    interface Todo {
      items: string[]
      filter: string
    }

    const todos = createStore<Todo>({ items: [], filter: 'all' })

    const actions = createActions(todos, {
      addItem: (state, text: string) => ({
        ...state,
        items: [...state.items, text],
      }),
      setFilter: (state, filter: string) => ({
        ...state,
        filter,
      }),
      clearItems: state => ({
        ...state,
        items: [],
      }),
    })

    await actions.addItem('Buy milk')
    await actions.addItem('Walk dog')
    expect(todos.get().items).toEqual(['Buy milk', 'Walk dog'])

    await actions.setFilter('completed')
    expect(todos.get().filter).toBe('completed')

    await actions.clearItems()
    expect(todos.get().items).toEqual([])
  })
})
