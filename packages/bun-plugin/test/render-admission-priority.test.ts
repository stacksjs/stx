import { describe, expect, it } from 'bun:test'
import { createRenderAdmission, RenderAdmissionError } from '../src/render-admission'

// An application lowering its own traffic: requests it can name but cannot
// refuse, such as signed-out visits to pages a crawler is told not to walk,
// share a bounded part of the renderer and never a person's place in it.

function held() {
  let release!: () => void
  const done = new Promise<void>(resolve => (release = resolve))
  return { done, release }
}

const crawlable = (request: Request) => new URL(request.url).pathname.startsWith('/tree/') ? 'background' as const : undefined
const page = (path: string, headers: Record<string, string> = {}) => new Request(`http://site.test${path}`, { headers })

describe('renderPriority', () => {
  it('lowers what the application names, and leaves everything else alone', async () => {
    const admission = createRenderAdmission({ renderPriority: crawlable })

    expect(await admission.priorityOf(page('/tree/main/src'))).toBe('background')
    expect(await admission.priorityOf(page('/issues'))).toBe('foreground')
  })

  it('cannot raise a request above what it asked for', async () => {
    const admission = createRenderAdmission({ renderPriority: () => 'foreground' })

    expect(await admission.priorityOf(page('/issues', { 'sec-purpose': 'prefetch' }))).toBe('background')
  })

  it('leaves a request where it was when the resolver throws', async () => {
    const admission = createRenderAdmission({ renderPriority: () => { throw new Error('boom') } })

    expect(await admission.priorityOf(page('/tree/main'))).toBe('foreground')
  })

  it('without a resolver is the request\'s own ask, as before', async () => {
    const admission = createRenderAdmission()

    expect(await admission.priorityOf(page('/tree/main'))).toBe('foreground')
    expect(await admission.priorityOf(page('/tree/main', { purpose: 'prefetch' }))).toBe('background')
  })

  it('may answer asynchronously, and a rejection leaves the request where it was', async () => {
    const lowered = createRenderAdmission({ renderPriority: async () => 'background' })
    const failing = createRenderAdmission({ renderPriority: async () => { throw new Error('lookup failed') } })

    expect(await lowered.priorityOf(page('/tree/main'))).toBe('background')
    expect(await failing.priorityOf(page('/tree/main'))).toBe('foreground')
  })
})

describe('background limits', () => {
  it('hold lowered traffic to its slots while people still get theirs', async () => {
    const admission = createRenderAdmission({ renderConcurrency: 4, renderQueueLimit: 8, renderBackgroundConcurrency: 1, renderBackgroundQueueLimit: 1 })
    const crawler = held()
    const running = admission.run(() => crawler.done, undefined, 'background')

    // The one background slot is taken: the next waits, the one after is refused.
    const waiting = admission.run(async () => 'second crawl', undefined, 'background')
    const refused = await admission.run(async () => 'third crawl', undefined, 'background').catch(error => error)
    expect(refused).toBeInstanceOf(RenderAdmissionError)
    expect(refused.status).toBe(503)

    // People are not behind any of it.
    expect(await admission.run(async () => 'person', undefined, 'foreground')).toBe('person')

    crawler.release()
    await running
    expect(await waiting).toBe('second crawl')
  })

  it('serve a waiting person before waiting background work', async () => {
    const admission = createRenderAdmission({ renderConcurrency: 1, renderQueueLimit: 4, renderBackgroundConcurrency: 1, renderBackgroundQueueLimit: 2 })
    const first = held()
    const order: string[] = []
    const running = admission.run(() => first.done, undefined, 'foreground')

    const crawl = admission.run(async () => { order.push('crawl') }, undefined, 'background')
    const person = admission.run(async () => { order.push('person') }, undefined, 'foreground')

    first.release()
    await Promise.all([running, crawl, person])
    expect(order).toEqual(['person', 'crawl'])
  })

  it('tell refused background work to wait longer, and a person to retry at once', async () => {
    const admission = createRenderAdmission({ renderConcurrency: 1, renderQueueLimit: 0, renderBackgroundRetryAfterSeconds: 30 })
    const busy = held()
    const running = admission.run(() => busy.done)

    const crawl = await admission.run(async () => {}, undefined, 'background').catch(error => error)
    const person = await admission.run(async () => {}, undefined, 'foreground').catch(error => error)

    expect(crawl.retryAfterSeconds).toBe(30)
    expect(person.retryAfterSeconds).toBe(1)
    busy.release()
    await running
  })

  it('never exceed the renderer\'s own capacity', async () => {
    const admission = createRenderAdmission({ renderConcurrency: 2, renderQueueLimit: 0, renderBackgroundConcurrency: 10 })
    const holds = [held(), held()]
    const running = holds.map(h => admission.run(() => h.done, undefined, 'background'))

    expect(await admission.run(async () => {}, undefined, 'background').catch(error => error.status)).toBe(503)
    holds.forEach(h => h.release())
    await Promise.all(running)
  })

  it('refuse a setting that is not a whole number', () => {
    expect(() => createRenderAdmission({ renderBackgroundConcurrency: 0 })).toThrow(RangeError)
    expect(() => createRenderAdmission({ renderBackgroundRetryAfterSeconds: 1.5 })).toThrow(RangeError)
  })
})
