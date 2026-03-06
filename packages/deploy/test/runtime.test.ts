import { describe, expect, test } from 'bun:test'
import { detectRuntime, isEdgeRuntime } from '../src/runtime'

describe('detectRuntime', () => {
  test('detects Bun runtime', () => {
    const info = detectRuntime()
    expect(info.platform).toBe('bun')
    expect(info.supportsStreaming).toBe(true)
    expect(info.supportsCrypto).toBe(true)
    expect(info.version).toBeTruthy()
    expect(info.capabilities).toContain('sqlite')
  })

  test('isEdgeRuntime returns false for Bun', () => {
    expect(isEdgeRuntime()).toBe(false)
  })
})
