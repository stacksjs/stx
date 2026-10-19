/**
 * sharedRequest: one request for every caller (run), an answer from after now
 * (fresh), and the newest answer only (latest). The browser runtime embeds the
 * same function by source, so the suite runs against both.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { sharedRequest as moduleSharedRequest } from '../../src/shared-request'
import { generateSignalsRuntimeDev } from '../../src/signals'

type Make = typeof moduleSharedRequest

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

/** A request the test answers by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const impls: Record<string, () => Make> = {
  module: () => moduleSharedRequest,
  // eslint-disable-next-line ts/no-explicit-any
  runtime: () => (globalThis as any).window.stx.sharedRequest,
}

for (const [name, get] of Object.entries(impls)) {
  describe(`sharedRequest (${name})`, () => {
    let sharedRequest: Make
    beforeAll(() => {
      sharedRequest = get()
    })

    it('is on window.stx and a bare global in the browser', () => {
      if (name !== 'runtime') return
      // eslint-disable-next-line ts/no-explicit-any
      expect(typeof (globalThis as any).window.sharedRequest).toBe('function')
    })

    it('run joins a request in flight for the same key', async () => {
      const shared = sharedRequest<string, number>()
      let starts = 0
      const answer = deferred<number>()
      const start = () => { starts++; return answer.promise }
      const a = shared.run('/a', start)
      const b = shared.run('/a', start)
      expect(a).toBe(b)
      expect(shared.busy).toBe(true)
      answer.resolve(1)
      expect(await a).toBe(1)
      expect(starts).toBe(1)
      expect(shared.busy).toBe(false)
    })

    it('run starts another for a key not covered', async () => {
      const shared = sharedRequest<string, string>()
      const urls: string[] = []
      const start = (url: string) => () => { urls.push(url); return Promise.resolve(url) }
      const [a, b] = await Promise.all([shared.run('/a', start('/a')), shared.run('/b', start('/b'))])
      expect([a, b]).toEqual(['/a', '/b'])
      expect(urls).toEqual(['/a', '/b'])
    })

    it('covers lets a wider request answer a narrower one', async () => {
      const shared = sharedRequest<{ month: string, day?: string }, string>({
        covers: (running, wanted) => running.month === wanted.month && !running.day,
      })
      let starts = 0
      const start = () => { starts++; return Promise.resolve('ok') }
      const month = shared.run({ month: '2026-10' }, start)
      const day = shared.run({ month: '2026-10', day: '18' }, start)
      expect(day).toBe(month)
      await month
      expect(starts).toBe(1)
    })

    it('a new run after one settled starts again', async () => {
      const shared = sharedRequest<string, number>()
      let starts = 0
      const start = () => Promise.resolve(++starts)
      expect(await shared.run('k', start)).toBe(1)
      expect(await shared.run('k', start)).toBe(2)
    })

    it('fresh never joins: it waits out the one in flight and asks once more, once for every caller', async () => {
      const shared = sharedRequest<string, string>()
      const order: string[] = []
      const first = deferred<string>()
      const out = shared.run('k', () => { order.push('first'); return first.promise })
      let reruns = 0
      const rerun = () => { reruns++; order.push('rerun'); return Promise.resolve('after') }
      const a = shared.fresh('k', rerun)
      const b = shared.fresh('k', rerun)
      // A run made meanwhile joins the request still in flight.
      const c = shared.run('k', rerun)
      expect(a).toBe(b)
      expect(c).toBe(out)
      await Promise.resolve()
      expect(reruns).toBe(0)
      first.resolve('before')
      expect(await out).toBe('before')
      expect(await a).toBe('after')
      expect(await b).toBe('after')
      expect(order).toEqual(['first', 'rerun'])
      expect(reruns).toBe(1)
      expect(shared.busy).toBe(false)
    })

    it('a run arriving after the old one settled but before the rerun started joins the rerun', async () => {
      const shared = sharedRequest<string, string>()
      const first = deferred<string>()
      void shared.run('k', () => first.promise)
      let starts = 0
      const rerun = () => { starts++; return Promise.resolve('after') }
      const fresh = shared.fresh('k', rerun)
      first.resolve('before')
      // Settled, the rerun not started yet: busy still, and joined.
      await first.promise
      expect(shared.busy).toBe(true)
      const joined = shared.run('k', rerun)
      expect(await joined).toBe('after')
      expect(await fresh).toBe('after')
      expect(starts).toBe(1)
    })

    it('fresh with nothing in flight starts at once', async () => {
      const shared = sharedRequest<string, number>()
      let starts = 0
      expect(await shared.fresh('k', () => Promise.resolve(++starts))).toBe(1)
      expect(starts).toBe(1)
    })

    it('fresh still runs when the request it waited on failed', async () => {
      const shared = sharedRequest<string, string>()
      const first = deferred<string>()
      const out = shared.run('k', () => first.promise)
      const after = shared.fresh('k', () => Promise.resolve('after'))
      first.reject(new Error('offline'))
      await expect(out).rejects.toThrow('offline')
      expect(await after).toBe('after')
    })

    it('a start that throws rejects that call and leaves nothing in flight', async () => {
      const shared = sharedRequest<string, string>()
      await expect(shared.run('k', () => { throw new Error('bad') })).rejects.toThrow('bad')
      expect(shared.busy).toBe(false)
      expect(await shared.run('k', () => Promise.resolve('ok'))).toBe('ok')
    })

    it('latest() is true only for the newest checker', () => {
      const shared = sharedRequest()
      const first = shared.latest()
      expect(first()).toBe(true)
      const second = shared.latest()
      expect(first()).toBe(false)
      expect(second()).toBe(true)
    })

    it('an answer that lost the race is dropped with latest()', async () => {
      const shared = sharedRequest<string, string>()
      const shown: string[] = []
      const slow = deferred<string>()
      const load = async (key: string, answer: Promise<string>) => {
        const isLatest = shared.latest()
        const value = await shared.run(key, () => answer)
        if (isLatest()) shown.push(value)
      }
      const a = load('/a', slow.promise)
      const b = load('/b', Promise.resolve('b'))
      slow.resolve('a')
      await Promise.all([a, b])
      expect(shown).toEqual(['b'])
    })
  })
}
