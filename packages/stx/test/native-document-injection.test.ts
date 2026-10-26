import { expect, test } from 'bun:test'
import { injectCraftBridge } from '../src/craft-bridge'
import { processCraftComponents } from '../src/craft-components'
import { insertBeforeDocumentClose } from '../src/document-injection'

test('native injection leaves router document literals intact', () => {
  const script = 'const shell = "<html><head></head><body></body></html>"; const label = "<style>";'
  const html = `<!doctype html><html><head><script>${script}</script></head><body><main>Launcher</main></body></html>`
  const result = processCraftComponents(injectCraftBridge(html))
  expect(result).toContain(`<script>${script}</script>`)
  const parsed = document.createElement('div')
  parsed.innerHTML = result
  expect(parsed.querySelector('#craft-component-runtime')?.parentElement?.tagName).toBe('BODY')
  expect(parsed.querySelector('#craft-component-styles')?.parentElement?.tagName).toBe('HEAD')
  expect(parsed.querySelector('main')?.textContent).toBe('Launcher')
  expect(parsed.querySelectorAll('script').length).toBe(3)
})

test('document insertion ignores comments, attributes and raw text, and supports legal closing whitespace', () => {
  const html = '<!-- </head> --><html><head><style>/* </head> */</style><script>const tag="</head>"</script></HEAD ><body title="</body>">ok</body></html>'
  const result = insertBeforeDocumentClose(html, 'head', '<meta name="qualified">')!
  expect(result).toContain('<meta name="qualified"></HEAD >')
  expect(result).toContain('const tag="</head>"')
  expect(insertBeforeDocumentClose('<p title="</body>">fragment</p>', 'body', 'runtime')).toBeNull()
})

test('native component injection is idempotent', () => {
  const once = processCraftComponents(injectCraftBridge('<html><head></head><body>App</body></html>'))
  expect(processCraftComponents(injectCraftBridge(once))).toBe(once)
})
