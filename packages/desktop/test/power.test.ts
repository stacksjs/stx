import { afterEach, describe, expect, it } from 'bun:test'
import { caffeinate, decaffeinate, getCaffeinateStatus } from '../src/power'

const assertions = () => Bun.spawnSync(['/usr/bin/pmset', '-g', 'assertions']).stdout.toString()
afterEach(() => decaffeinate())

describe.skipIf(process.platform !== 'darwin')('native power lifecycle', () => {
  it('owns real display and idle assertions and releases them on stop', () => {
    const session = caffeinate()
    expect(session.pid).toBe(process.pid)
    expect(assertions()).toContain('stx: keeping your Mac awake')
    decaffeinate()
    expect(getCaffeinateStatus().active).toBe(false)
    expect(assertions()).not.toContain('stx: keeping your Mac awake')
  })

  it('releases a timed session before notifying expiration subscribers', async () => {
    const session = caffeinate({ duration: 0.001 })
    let expired = false
    session.onExpire(() => { expired = true })
    await Bun.sleep(150)
    expect(expired).toBe(true)
    expect(session.isActive).toBe(false)
    expect(assertions()).not.toContain('stx: keeping your Mac awake')
    session.stop()
  })

  it('replaces a session and rejects invalid durations without losing it', () => {
    const first = caffeinate()
    const second = caffeinate({ duration: 1 })
    expect(first.isActive).toBe(false)
    expect(second.isActive).toBe(true)
    for (const duration of [0, -2, Number.NaN, Number.POSITIVE_INFINITY])
      expect(() => caffeinate({ duration })).toThrow()
    expect(second.isActive).toBe(true)
    decaffeinate(first)
    expect(second.isActive).toBe(true)
  })
})
