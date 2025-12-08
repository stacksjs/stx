import { describe, expect, it } from 'bun:test'
import {
  detectRuntime,
  isEdgeEnvironment,
  isServerEnvironment,
} from '../../src/edge-runtime'

describe('detectRuntime', () => {
  it('should return runtime info object', () => {
    const info = detectRuntime()

    expect(info).toBeDefined()
    expect(info.platform).toBeDefined()
    expect(typeof info.supportsStreaming).toBe('boolean')
    expect(typeof info.supportsCrypto).toBe('boolean')
    expect(typeof info.supportsKV).toBe('boolean')
    expect(typeof info.supportsCache).toBe('boolean')
    expect(Array.isArray(info.capabilities)).toBe(true)
  })

  it('should detect Bun runtime', () => {
    const info = detectRuntime()

    // Since we're running in Bun, it should detect Bun
    expect(info.platform).toBe('bun')
    expect(info.version).toBeDefined()
  })

  it('should report streaming support for Bun', () => {
    const info = detectRuntime()
    expect(info.supportsStreaming).toBe(true)
  })

  it('should report crypto support for Bun', () => {
    const info = detectRuntime()
    expect(info.supportsCrypto).toBe(true)
  })

  it('should include capabilities array', () => {
    const info = detectRuntime()
    expect(Array.isArray(info.capabilities)).toBe(true)
  })
})

describe('isEdgeEnvironment', () => {
  it('should return false for Bun', () => {
    // Bun is not considered an edge environment
    expect(isEdgeEnvironment()).toBe(false)
  })
})

describe('isServerEnvironment', () => {
  it('should return true for Bun', () => {
    // Bun is a server environment
    expect(isServerEnvironment()).toBe(true)
  })
})
