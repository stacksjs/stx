import type { BreathPacerStep } from '../../src/composables/use-breath-pacer'
import { describe, expect, it } from 'bun:test'
import { useAmbientSound } from '../../src/composables/use-ambient-sound'
import { endStepEarly, pacerScale, positionAt, seekBreath, stepOffsets, useBreathPacer } from '../../src/composables/use-breath-pacer'

const box: BreathPacerStep[] = [
  { kind: 'breathe', seconds: 10 },
  { kind: 'in', seconds: 4 },
  { kind: 'hold', seconds: 4 },
  { kind: 'out', seconds: 4 },
  { kind: 'pause', seconds: 4, open: true },
  { kind: 'in', seconds: 4 },
]

describe('breath timeline', () => {
  it('knows where every second falls', () => {
    expect(stepOffsets(box)).toEqual({ starts: [0, 10, 14, 18, 22, 26], total: 30 })
    expect(positionAt(box, 0).step?.kind).toBe('breathe')
    const inhale = positionAt(box, 12)
    expect(inhale).toMatchObject({ index: 1, into: 2, progress: 0.5, remaining: 2, total: 30, done: false })
    expect(positionAt(box, 14).step?.kind).toBe('hold')
    expect(positionAt(box, 31)).toMatchObject({ done: true, step: null, index: 6, elapsed: 30 })
    expect(positionAt([], 3).done).toBe(true)
  })

  it('ends only an open hold early, and moves the rest up', () => {
    const ended = endStepEarly(box, 22 + 2.34)
    expect(ended.held).toBe(2.3)
    expect(positionAt(ended.steps, 24.5).step?.kind).toBe('in')
    expect(stepOffsets(ended.steps).total).toBeCloseTo(28.3)
    expect(endStepEarly(box, 12).held).toBe(0)
  })

  it('seeks inside the exercise', () => {
    expect(seekBreath(box, 5, -10)).toBe(0)
    expect(seekBreath(box, 25, 10)).toBe(30)
    expect(seekBreath(box, 5, 10)).toBe(15)
  })

  it('fills the pacer on an inhale and empties it on an exhale', () => {
    expect(pacerScale(positionAt(box, 10))).toBeCloseTo(0.6)
    expect(pacerScale(positionAt(box, 12))).toBeCloseTo(0.8)
    expect(pacerScale(positionAt(box, 15))).toBe(1)
    expect(pacerScale(positionAt(box, 20))).toBeCloseTo(0.8)
    expect(pacerScale(positionAt(box, 23))).toBe(0.6)
    expect(pacerScale(positionAt(box, 40))).toBe(0.6)
  })
})

describe('useBreathPacer', () => {
  function pacerWithClock(steps = box) {
    let ms = 1000
    const seen: string[] = []
    let finished = -1
    const pacer = useBreathPacer(steps, {
      now: () => ms,
      onStep: step => seen.push(step.kind),
      onDone: (seconds) => { finished = seconds },
    })
    return { pacer, seen, advance: (seconds: number) => { ms += seconds * 1000 }, finished: () => finished }
  }

  it('plays each step once, in order, then finishes', () => {
    const { pacer, seen, advance, finished } = pacerWithClock()
    pacer.start()
    for (let second = 0; second < 31; second++) {
      advance(1)
      pacer.tick()
    }
    expect(seen).toEqual(['breathe', 'in', 'hold', 'out', 'pause', 'in'])
    expect(pacer.state).toBe('done')
    expect(finished()).toBeCloseTo(30, 0)
  })

  it('never counts a pause', () => {
    const { pacer, advance } = pacerWithClock()
    pacer.start()
    advance(5)
    pacer.pause()
    advance(100)
    expect(pacer.position().elapsed).toBe(5)
    pacer.resume()
    advance(3)
    expect(pacer.position().elapsed).toBe(8)
    expect(pacer.activeSeconds).toBe(8)
  })

  it('seeks, and a seek does not replay the step it lands in', () => {
    const { pacer, seen, advance } = pacerWithClock()
    pacer.start()
    pacer.seek(11)
    pacer.tick()
    advance(1)
    pacer.tick()
    expect(pacer.position().step?.kind).toBe('in')
    expect(seen).toEqual(['breathe'])
  })

  it('ends a hold on “breathe now” and remembers the longest', () => {
    const { pacer, advance } = pacerWithClock()
    pacer.start()
    pacer.seek(22)
    advance(3)
    expect(pacer.tick().step?.kind).toBe('pause')
    expect(pacer.breatheNow()).toBe(3)
    expect(pacer.longestHold).toBe(3)
    expect(pacer.tick().step?.kind).toBe('in')
    expect(pacer.breatheNow()).toBe(0)
  })

  it('resets with new steps', () => {
    const { pacer } = pacerWithClock()
    pacer.start()
    pacer.reset([{ kind: 'in', seconds: 2 }])
    expect(pacer.state).toBe('ready')
    expect(pacer.position().total).toBe(2)
  })
})

describe('useAmbientSound', () => {
  it('is silent and harmless where there is no Web Audio', async () => {
    const sound = useAmbientSound()
    await sound.start('nature', 0.5)
    expect(sound.playing).toBe(false)
    sound.breathTone('in', 4)
    sound.chime()
    sound.volume(2)
    await sound.stop()
    expect(sound.playing).toBe(false)
  })
})
