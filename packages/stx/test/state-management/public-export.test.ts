import { describe, expect, it } from 'bun:test'
import * as stx from '../../src/index'

describe('state management public exports', () => {
  it('exposes client store registration from the package root', () => {
    expect(typeof stx.registerStoresClient).toBe('function')
  })
})
