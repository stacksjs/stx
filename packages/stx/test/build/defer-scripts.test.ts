import { expect, test } from 'bun:test'
import { deferScripts } from '../../src/build-defer-scripts'

test('defers runtime and dependent setup in document order, preserving attributes', () => {
  const input = '<head><script data-stx-runtime src="/_stx/runtime.js"></script><script nonce="test" data-stx-modules>window.setup = true</script></head><body><script client>window.setup()</script></body>'
  const result = deferScripts(input)
  expect(result.html).toContain('data-stx-runtime src="/_stx/runtime.js" defer')
  expect(result.assets.map(asset => asset.contents)).toEqual(['window.setup = true', 'window.setup()'])
  expect(result.html).toContain('nonce="test" data-stx-modules defer src="/_stx/modules.')
  expect(result.html.indexOf(result.assets[0]!.filename)).toBeLessThan(result.html.indexOf(result.assets[1]!.filename))
  expect(result.bytesInlined).toBe('window.setup = truewindow.setup()'.length)
  expect(deferScripts(result.html)).toEqual({ html: result.html, assets: [], bytesInlined: 0 })
})

test('keeps pre-paint, data, module, async and inert template scripts untouched', () => {
  const preserved = '<script data-stx-appearance-bootstrap>preferences()</script><script data-stx-color-mode-boot>theme()</script><script stx-inline>paint()</script><script type="application/ld+json">{}</script><script type=module src="/module.js"></script><script async src="/third-party.js"></script><template><template><script>nested()</script></template><script>later()</script></template>'
  expect(deferScripts(preserved)).toEqual({ html: preserved, assets: [], bytesInlined: 0 })
})

test('deduplicates identical setup and supports a custom asset base', () => {
  const result = deferScripts('<script>same()</script><script>same()</script>', '/assets')
  expect(result.assets).toHaveLength(1)
  expect(result.html.match(/src="\/assets\//g)).toHaveLength(2)
})
