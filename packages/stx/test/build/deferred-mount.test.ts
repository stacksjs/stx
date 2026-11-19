import { expect, test } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { flushEffects, setupStxTestDom, shimAttributes } from '../../src/testing'

test('deferred component setup waits for the remaining scripts before mounting', async () => {
  setupStxTestDom()
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  document.body.innerHTML = '<section id="target">SSR content</section><script defer></script>'
  shimAttributes(document.body)
  const script = document.querySelector('script')!
  Object.defineProperty(script, 'defer', { configurable: true, value: true })
  Object.defineProperty(document, 'readyState', { configurable: true, value: 'interactive' })
  Object.defineProperty(document, 'currentScript', { configurable: true, value: script })
  const runtime = (window as any).stx
  const mounts: string[] = []
  runtime.mountEl('#target', () => { (window as any).onMount(() => mounts.push('element')); return {} })
  runtime.mount(() => { (window as any).onMount(() => mounts.push('component')); return {} })
  expect(mounts).toEqual([])
  document.dispatchEvent(new Event('DOMContentLoaded'))
  await flushEffects()
  expect(mounts).toEqual(['element', 'component'])
  Object.defineProperty(document, 'readyState', { configurable: true, value: 'complete' })
  Object.defineProperty(document, 'currentScript', { configurable: true, value: null })
})
