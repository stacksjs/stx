type Subscriber = () => void

interface DependencyTracker {
  track: (subscriber: Subscriber, source: Set<Subscriber>) => void
  clear: (subscriber: Subscriber) => void
}

/** @internal Shared with the generated runtime. Keep the factory closure-free. */
export function createDependencyTracker(): DependencyTracker {
  const sourcesBySubscriber = new WeakMap<Subscriber, Set<Set<Subscriber>>>()

  function track(subscriber: Subscriber, source: Set<Subscriber>): void {
    if (source.has(subscriber)) return
    source.add(subscriber)
    let sources = sourcesBySubscriber.get(subscriber)
    if (!sources) {
      sources = new Set()
      sourcesBySubscriber.set(subscriber, sources)
    }
    sources.add(source)
  }

  function clear(subscriber: Subscriber): void {
    const sources = sourcesBySubscriber.get(subscriber)
    if (!sources) return
    for (const source of sources) source.delete(subscriber)
    sources.clear()
  }

  return { track, clear }
}
