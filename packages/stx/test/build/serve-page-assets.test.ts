import { expect, test } from 'bun:test'
import { getServeModuleBundle } from '../../src/caching'
import { prepareServePageAssets } from '../../src/serve-page-assets'

test('SSR setup and island chunks use the native served-asset registry', () => {
  const html = '<html><head><style stx-inline>.critical{color:red}</style><script data-stx-appearance-bootstrap>preferences()</script><script data-stx-runtime src="/_stx/runtime.12345678.js"></script></head><body><div data-stx-scope="island" stx-hydrate="visible">SSR content</div><script type="stx/island" data-stx-island="island">window.islandReady=true;</script><script data-stx-scoped>window.setupReady=true;</script></body></html>'
  const output = prepareServePageAssets(html)
  expect(output).toContain('<style stx-inline>.critical{color:red}</style>')
  expect(output).toContain('<script data-stx-appearance-bootstrap>preferences()</script>')
  expect(output).toContain('src="/_stx/runtime.12345678.js" defer')
  expect(output).toContain('SSR content')
  expect(output).toContain('rel="prefetch"')
  const hashes = [...output.matchAll(/(?:src|data-stx-src)="\/_stx\/modules\.([a-f0-9]{16})\.js"/g)].map(match => match[1]!)
  const code = hashes.map(hash => getServeModuleBundle(hash)).join('\n')
  expect(code).toContain('window.islandReady')
  expect(code).toContain('window.setupReady')
  expect(prepareServePageAssets(output)).toBe(output)
})

