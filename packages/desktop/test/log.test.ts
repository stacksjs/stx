import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { log } from '../src/log'
import { findCall, installMockBridge } from './_mock-bridge'

describe('log', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['log']) })
  afterEach(() => { bridge.uninstall() })

  it('forwards each level to the bridge', async () => {
    await log.debug('d')
    await log.info('i')
    await log.warn('w')
    await log.error('e')
    expect(findCall(bridge.calls, 'log', 'debug')).toBeDefined()
    expect(findCall(bridge.calls, 'log', 'info')).toBeDefined()
    expect(findCall(bridge.calls, 'log', 'warn')).toBeDefined()
    expect(findCall(bridge.calls, 'log', 'error')).toBeDefined()
  })

  it('falls back to console when bridge missing', async () => {
    bridge.uninstall()
    await expect(log.info('hello')).resolves.toBeUndefined()
  })
})
