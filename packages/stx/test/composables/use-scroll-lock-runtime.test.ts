import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { useScrollLock as useModuleScrollLock } from '../../src/composables/use-scroll-lock'
import { generateSignalsRuntimeDev } from '../../src/signals'

interface ScrollLockSignal {
  (): boolean
  set: (value: boolean) => void
  value: boolean
}

type UseScrollLock = (target?: HTMLElement | { current: HTMLElement | null }) => ScrollLockSignal

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

function implementations(): Record<string, UseScrollLock> {
  // eslint-disable-next-line ts/no-explicit-any
  const runtime = (globalThis as any).window?.stx?.useScrollLock as UseScrollLock
  return {
    module: useModuleScrollLock as UseScrollLock,
    runtime,
  }
}

for (const name of ['module', 'runtime'] as const) {
  describe(`useScrollLock (${name})`, () => {
    let useScrollLock: UseScrollLock

    beforeAll(() => {
      useScrollLock = implementations()[name]
      if (!useScrollLock)
        throw new Error(`impl ${name} not available`)
    })

    beforeEach(() => {
      document.body.style.overflow = ''
    })

    it('locks and restores the document body', () => {
      document.body.style.overflow = 'auto'
      const locked = useScrollLock()

      locked.set(true)
      expect(locked()).toBe(true)
      expect(locked.value).toBe(true)
      expect(document.body.style.overflow).toBe('hidden')

      locked.value = false
      expect(document.body.style.overflow).toBe('auto')
    })

    it('supports element refs', () => {
      const target = document.createElement('div')
      target.style.overflow = 'scroll'
      const locked = useScrollLock({ current: target })

      locked.set(true)
      expect(target.style.overflow).toBe('hidden')
      locked.set(false)
      expect(target.style.overflow).toBe('scroll')
    })

    it('keeps shared targets locked until every owner releases', () => {
      const first = useScrollLock()
      const second = useScrollLock()

      first.set(true)
      second.set(true)
      first.set(false)
      expect(document.body.style.overflow).toBe('hidden')

      second.set(false)
      expect(document.body.style.overflow).toBe('')
    })
  })
}
