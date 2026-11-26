import { describe, expect, it } from 'bun:test'
import { createRenderAdmission, RenderAdmissionError } from '../src/render-admission'
import { createRenderReport, percentile, renderLabel } from '../src/render-report'

// What the renderer has been doing, in its log. A renderer refusing every page
// and one rendering every page slowly looked the same from outside until these
// two lines existed.

function held() {
  let release!: () => void
  const done = new Promise<void>(resolve => (release = resolve))
  return { done, release }
}

const page = (path: string) => new Request(`http://site.test${path}`)

describe('the slow render line', () => {
  it('names a render past the threshold, with its path, class and wait', async () => {
    const lines: string[] = []
    const admission = createRenderAdmission({ renderReport: { slowMs: 20, log: line => lines.push(line) } })

    await admission.run(async () => { await Bun.sleep(30) }, undefined, 'background', page('/o/r/tree/main?token=secret'))
    await admission.run(async () => {}, undefined, 'foreground', page('/fast'))

    expect(lines).toHaveLength(1)
    expect(lines[0]).toMatch(/^\[stx\] slow render \d+ms \/o\/r\/tree\/main \(background, waited \d+ms\)$/)
  })

  it('never writes the query string, where a token would be', async () => {
    const lines: string[] = []
    const admission = createRenderAdmission({ renderReport: { slowMs: 0, log: line => lines.push(line) } })

    await admission.run(async () => {}, undefined, 'foreground', page('/reset?token=secret'))

    expect(lines.join('\n')).not.toContain('secret')
  })

  it('says a render failed when it threw', async () => {
    const lines: string[] = []
    const admission = createRenderAdmission({ renderReport: { slowMs: 0, log: line => lines.push(line) } })

    await admission.run(async () => { throw new Error('boom') }, undefined, 'foreground', page('/broken')).catch(() => {})

    expect(lines[0]).toContain('failed')
  })
})

describe('the summary', () => {
  it('totals each class, and tells a refusal from a wait that ran out', async () => {
    const admission = createRenderAdmission({ renderConcurrency: 1, renderQueueLimit: 1, renderQueueTimeoutMs: 30, renderReport: {} })
    const busy = held()
    const running = admission.run(() => busy.done, undefined, 'foreground', page('/a'))

    // One waits and runs out of time; the next finds the queue full.
    const expired = admission.run(async () => {}, undefined, 'foreground', page('/b')).catch(error => error)
    const refused = await admission.run(async () => {}, undefined, 'foreground', page('/c')).catch(error => error)
    expect(refused).toBeInstanceOf(RenderAdmissionError)
    expect((await expired).expired).toBe(true)
    expect(refused.expired).toBe(false)

    busy.release()
    await running
    const line = admission.flushReport()!

    expect(line).toMatch(/^\[stx\] renders: foreground: 1 rendered, 1 refused, 1 expired waiting, run p50 \d+ms p95 \d+ms, longest wait \d+ms, slowest \/a \d+ms$/)
  })

  it('names both classes when both had traffic', async () => {
    const admission = createRenderAdmission({ renderReport: {} })
    await admission.run(async () => {}, undefined, 'foreground', page('/'))
    await admission.run(async () => {}, undefined, 'background', page('/o/r/blob/x'))

    const line = admission.flushReport()!

    expect(line).toContain('foreground: 1 rendered')
    expect(line).toContain('; background: 1 rendered')
  })

  it('says nothing for an interval with no traffic, and starts each interval fresh', async () => {
    const admission = createRenderAdmission({ renderReport: {} })
    expect(admission.flushReport()).toBeNull()

    await admission.run(async () => {}, undefined, 'foreground', page('/'))
    expect(admission.flushReport()).not.toBeNull()
    expect(admission.flushReport()).toBeNull()
  })

  it('arrives on its own once an interval', async () => {
    const lines: string[] = []
    const report = createRenderReport({ intervalMs: 1000, log: line => lines.push(line) })
    report.record({ label: '/', priority: 'foreground', outcome: 'rendered', waitedMs: 0, ranMs: 5 })

    await Bun.sleep(1100)
    report.stop()

    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('foreground: 1 rendered')
  })

  it('refuses an interval short enough to flood the log', () => {
    expect(() => createRenderReport({ intervalMs: 10 })).toThrow(RangeError)
  })

  it('records nothing and costs nothing when it is not asked for', async () => {
    const admission = createRenderAdmission()
    await admission.run(async () => {}, undefined, 'foreground', page('/'))

    expect(admission.flushReport()).toBeNull()
  })
})

it('percentile is the value below which that share of samples fall', () => {
  expect(percentile([], 0.5)).toBe(0)
  expect(percentile([5, 1, 3], 0.5)).toBe(3)
  expect(percentile([1, 2, 3, 4, 100], 0.95)).toBe(100)
})

it('renderLabel is the path alone', () => {
  expect(renderLabel(page('/x/y?z=1#h'))).toBe('/x/y')
  expect(renderLabel()).toBe('(no request)')
})
