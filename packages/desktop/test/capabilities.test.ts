import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { getCapabilities, getCapability, isAvailable } from '../src/capabilities'
import { installMockBridge } from './_mock-bridge'

describe('capabilities', () => {
  afterEach(() => {
    delete (window as any).craft
  })

  it('returns a non-empty list of known bridges', () => {
    const caps = getCapabilities()
    expect(caps.length).toBeGreaterThan(20)
    // Spot-check a few core entries.
    expect(caps.some(c => c.name === 'fs')).toBe(true)
    expect(caps.some(c => c.name === 'clipboard')).toBe(true)
    expect(caps.some(c => c.name === 'midi')).toBe(true)
  })

  it('every entry has a valid support level', () => {
    const supports = new Set(['all', 'native', 'macos'])
    for (const cap of getCapabilities()) {
      expect(supports.has(cap.support)).toBe(true)
    }
  })

  it('reports available:false when no bridge is installed', () => {
    delete (window as any).craft
    expect(getCapabilities().every(c => c.available === false)).toBe(true)
  })

  it('reports available:true for namespaces the bridge exposes', () => {
    const bridge = installMockBridge(['fs', 'midi'])
    try {
      const fsCap = getCapability('fs')
      const midiCap = getCapability('midi')
      expect(fsCap?.available).toBe(true)
      expect(midiCap?.available).toBe(true)
    }
    finally {
      bridge.uninstall()
    }
  })

  it('getCapability returns undefined for unknown bridge names', () => {
    expect(getCapability('not-a-real-bridge')).toBeUndefined()
  })

  it('isAvailable narrows known + reachable in one call', () => {
    const bridge = installMockBridge(['vision'])
    try {
      expect(isAvailable('vision')).toBe(true)
      expect(isAvailable('not-real')).toBe(false)
    }
    finally {
      bridge.uninstall()
    }
  })

  it('macOS-flagged bridges share the "macos" support level', () => {
    const macOnly = ['biometric', 'vision', 'midi', 'handoff', 'touchbar', 'spotlight', 'continuityCamera']
    for (const name of macOnly) {
      const cap = getCapability(name)
      expect(cap?.support).toBe('macos')
    }
  })

  it('cross-platform bridges share the "all" support level', () => {
    const allPlatforms = ['clipboard', 'theme', 'system', 'notifications', 'crashReporter', 'log']
    for (const name of allPlatforms) {
      const cap = getCapability(name)
      expect(cap?.support).toBe('all')
    }
  })
})
