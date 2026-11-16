import { expect, it } from 'bun:test'
import { createRenderAdmission, renderRequestPriority } from '../src/render-admission'

it('recognizes browser speculation headers without lowering ordinary navigation', () => {
  expect(renderRequestPriority()).toBe('foreground')
  for (const name of ['Purpose', 'Sec-Purpose']) {
    for (const value of ['prefetch', 'Prefetch;prerender', 'prerender'])
      expect(renderRequestPriority(new Request('https://app.test', { headers: { [name]: value } }))).toBe('background')
    expect(renderRequestPriority(new Request('https://app.test', { headers: { [name]: 'not-prefetch' } }))).toBe('foreground')
  }
})

it('reserves active capacity for navigation while several clients preload pages', async () => {
  const admission = createRenderAdmission({ renderConcurrency: 4, renderQueueLimit: 8 })
  const release = Promise.withResolvers<void>()
  const started: string[] = []
  const requests = Array.from({ length: 4 }, (_, index) => admission.run(async () => {
    started.push(`background ${index}`)
    await release.promise
  }, undefined, 'background'))
  const navigation = admission.run(async () => { started.push('navigation') })
  try {
    await Promise.resolve()
    await Promise.resolve()
    expect(started).toEqual(['background 0', 'background 1', 'navigation'])
    await navigation
  }
  finally {
    release.resolve()
    await Promise.allSettled([...requests, navigation])
  }
  expect(started).toEqual(['background 0', 'background 1', 'navigation', 'background 2', 'background 3'])
})

it('admits waiting user navigation before earlier background preloads without losing their order', async () => {
  const admission = createRenderAdmission({ renderConcurrency: 1, renderQueueLimit: 4 })
  const active = Promise.withResolvers<void>()
  const firstBackground = Promise.withResolvers<void>()
  const secondBackground = Promise.withResolvers<void>()
  const order: string[] = []
  const running = admission.run(() => active.promise)
  await Promise.resolve()
  const first = admission.run(async () => { order.push('first background'); await firstBackground.promise }, undefined, 'background')
  const second = admission.run(async () => { order.push('second background'); await secondBackground.promise }, undefined, 'background')
  const foreground = admission.run(async () => { order.push('navigation') })
  try {
    active.resolve()
    await running
    await Promise.resolve()
    expect(order[0]).toBe('navigation')
    await foreground
  }
  finally {
    active.resolve()
    firstBackground.resolve()
    secondBackground.resolve()
    await Promise.allSettled([running, first, second, foreground])
  }
  expect(order).toEqual(['navigation', 'first background', 'second background'])
})
