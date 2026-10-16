import { describe, expect, it } from 'bun:test'
import { createLiveActivity, type NativeLiveActivities, type NativeLiveActivityOptions } from '../../src/native/live-activity'

const first: NativeLiveActivityOptions = { activityId: 'session-1', title: 'Workout', status: 'Running', timerStartedAt: 1000 }
function fake() {
  const calls: unknown[][] = []
  const bridge: NativeLiveActivities = {
    isAvailable: async () => true,
    list: async () => [],
    start: async options => { calls.push(['start', options]); return { id: options.activityId + '-native' } },
    update: async (id, state) => { calls.push(['update', id, state]) },
    end: async id => { calls.push(['end', id]) },
  }
  return { calls, bridge }
}

describe('declarative native Live Activity', () => {
  it('updates only the activity it owns and ignores identical states', async () => {
    const { bridge, calls } = fake()
    const live = createLiveActivity(bridge)
    await live.update(first)
    await live.update(first)
    await live.update({ ...first, paused: true, durationSeconds: 12, remainingSeconds: null })
    await live.end()
    expect(calls.map(call => call[0])).toEqual(['start', 'update', 'end'])
    expect(calls[1]?.[1]).toBe('session-1-native')
    expect((calls[1]?.[2] as NativeLiveActivityOptions).remainingSeconds).toBeNull()
    expect(calls[2]).toEqual(['end', 'session-1-native'])
  })

  it('ends a start that completes after the session stopped', async () => {
    const { bridge, calls } = fake()
    let resolve: (value: { id: string }) => void = () => {}
    bridge.start = () => new Promise(done => { resolve = done })
    const live = createLiveActivity(bridge)
    const starting = live.update(first)
    await Promise.resolve()
    const ending = live.end()
    resolve({ id: 'late-id' })
    await Promise.all([starting, ending])
    expect(calls).toEqual([['end', 'late-id']])
  })

  it('coalesces intermediate states and ends the previous session before replacing it', async () => {
    const { bridge, calls } = fake()
    let resolve: (value: { id: string }) => void = () => {}
    bridge.start = () => new Promise(done => { resolve = done })
    const live = createLiveActivity(bridge)
    const starting = live.update(first)
    await Promise.resolve()
    void live.update({ ...first, status: 'Older' })
    void live.update({ ...first, status: 'Latest' })
    resolve({ id: 'first' })
    await starting
    expect((calls[0]?.[2] as NativeLiveActivityOptions).status).toBe('Latest')
    bridge.start = async () => { calls.push(['start-new']); return { id: 'second' } }
    await live.update({ ...first, activityId: 'session-2' })
    expect(calls.slice(-2)).toEqual([['end', 'first'], ['start-new']])
  })

  it('has no fabricated activity on an unsupported host or when authorization is denied', async () => {
    await createLiveActivity(null).update(first)
    const { bridge, calls } = fake()
    bridge.isAvailable = async () => false
    await createLiveActivity(bridge).update(first)
    expect(calls).toEqual([])
  })

  it('delivers a state change queued as a native start settles', async () => {
    const { bridge, calls } = fake()
    const live = createLiveActivity(bridge)
    bridge.start = async () => {
      queueMicrotask(() => queueMicrotask(() => { void live.update({ ...first, paused: true }) }))
      return { id: 'settled-id' }
    }
    await live.update(first)
    expect(calls).toEqual([['update', 'settled-id', { ...first, paused: true }]])
  })

  it('reports native failures without interrupting the session', async () => {
    const { bridge } = fake()
    const errors: unknown[] = []
    bridge.start = async () => { throw new Error('Denied') }
    await createLiveActivity(bridge, error => errors.push(error)).update(first)
    expect(errors).toHaveLength(1)
  })
})
