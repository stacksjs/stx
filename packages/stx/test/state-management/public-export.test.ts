import { describe, expect, it } from 'bun:test'
import * as stx from '../../src/index'

describe('state management public exports', () => {
  it('exposes client store registration from the package root', () => {
    expect(typeof stx.registerStoresClient).toBe('function')
  })

  it('accepts setup-style stores', () => {
    const exampleStore = stx.defineStore('public-export-example', () => ({
      ready: stx.state(true),
    }))

    stx.registerStoresClient({ exampleStore })
    expect(exampleStore.ready()).toBe(true)
  })
})
