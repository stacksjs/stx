/**
 * sharedRequest - one request for every caller that wants the same answer.
 *
 * Every store that loads data ended up writing the same three pieces by hand:
 * a `let inflight: Promise | null` so two screens mounting at once send one
 * request, a "wait for the one in flight, then ask again" for a load that must
 * see a change just made, and a `const mine = ++request` counter so an answer
 * that lost the race does not overwrite a newer one. Each copy got one of the
 * three slightly wrong: a pull to refresh that joined the ordinary load already
 * out (and showed what the server had before the change), or a load for a new
 * URL answered with the old URL's data.
 *
 * @example
 * ```ts
 * const list = sharedRequest<string, Row[]>()
 *
 * // Two callers, one request: the second joins the first.
 * const rows = await list.run(url, () => api.get(url))
 *
 * // After a write: never joins a request that may have been read before it;
 * // waits that one out, then asks once more.
 * await list.fresh(url, () => api.get(url))
 *
 * // Only the newest answer lands.
 * const isLatest = list.latest()
 * const answer = await list.run(url, () => api.get(url))
 * if (isLatest()) rows.set(answer)
 * ```
 *
 * Closure-free: the browser runtime embeds `sharedRequest` by source
 * (signals.ts), and `createQueryCache` is handed it, so it may use nothing
 * from this module's scope.
 *
 * @module shared-request
 */

export interface SharedRequestOptions<K> {
  /**
   * Whether a request in flight for `running` answers one for `wanted`, so
   * `run(wanted)` joins it. Default: the same key (`Object.is`). Give one for
   * keys that are objects, or where a wider request covers a narrower one (a
   * month's request answering for one of its days).
   */
  covers?: (running: K, wanted: K) => boolean
}

export interface SharedRequest<K, T> {
  /**
   * Join a request in flight whose key covers `key` (or a `fresh` rerun
   * waiting to start), or start one with `start`. Every caller gets the same
   * promise.
   */
  run: (key: K, start: () => Promise<T>) => Promise<T>
  /**
   * An answer from after now: never joins a request already in flight (it may
   * have been read before a change just made). If one covering `key` is out,
   * waits for it to settle and then starts once more; calls made meanwhile
   * share that one rerun (the first call's `start` is the one used).
   */
  fresh: (key: K, start: () => Promise<T>) => Promise<T>
  /**
   * A checker that stays true until `latest()` is called again: take one when
   * starting work and test it when the answer lands, instead of a
   * `const mine = ++request` counter.
   */
  latest: () => () => boolean
  /** True while a request is out or a fresh rerun is waiting to start. */
  readonly busy: boolean
}

/** One request for every caller that wants the same answer. Closure-free. */
export function sharedRequest<K = string, T = unknown>(options?: SharedRequestOptions<K>): SharedRequest<K, T> {
  const covers = (options && options.covers) || ((running: K, wanted: K) => Object.is(running, wanted))
  const flights: Array<{ key: K, promise: Promise<T> }> = []
  const waiting: Array<{ key: K, promise: Promise<T> }> = []
  let ticket = 0

  const launch = (key: K, start: () => Promise<T>): Promise<T> => {
    let promise: Promise<T>
    try {
      promise = Promise.resolve(start())
    }
    catch (error) {
      promise = Promise.reject(error)
    }
    const flight = { key, promise }
    flights.push(flight)
    // Off the list before anything awaiting the promise runs: a caller that
    // asks `busy` (or runs again) once its answer lands sees this one done.
    const land = (): void => {
      const at = flights.indexOf(flight)
      if (at !== -1)
        flights.splice(at, 1)
    }
    promise.then(land, land)
    return promise
  }

  return {
    run(key, start) {
      for (const flight of flights) {
        if (covers(flight.key, key))
          return flight.promise
      }
      // A rerun waiting to start answers from later than anything else would.
      for (const queued of waiting) {
        if (covers(queued.key, key))
          return queued.promise
      }
      return launch(key, start)
    },
    fresh(key, start) {
      for (const queued of waiting) {
        if (covers(queued.key, key))
          return queued.promise
      }
      const before = flights.filter(flight => covers(flight.key, key)).map(flight => flight.promise)
      if (!before.length)
        return launch(key, start)
      const queued = { key, promise: null as unknown as Promise<T> }
      const settled = (): void => {}
      queued.promise = Promise.all(before.map(promise => promise.then(settled, settled))).then(() => {
        const at = waiting.indexOf(queued)
        if (at !== -1)
          waiting.splice(at, 1)
        return launch(key, start)
      })
      waiting.push(queued)
      return queued.promise
    },
    latest() {
      const mine = ++ticket
      return () => mine === ticket
    },
    get busy() {
      return flights.length > 0 || waiting.length > 0
    },
  }
}
