import { describe, expect, it } from 'bun:test'
import { generateServerDataBridge } from '../src/client-script'

describe('server to client data bridge', () => {
  it('does not redeclare Vue-style destructured props', () => {
    const code = `
const { title, padding = 'md', source: localSource } = defineProps()
console.log(title, padding, localSource, untouched)
`
    const bridge = generateServerDataBridge(code, {
      title: 'Dashboard',
      padding: 'none',
      localSource: 'settings',
      untouched: 42,
    })

    expect(bridge).not.toContain('var title')
    expect(bridge).not.toContain('var padding')
    expect(bridge).not.toContain('var localSource')
    expect(bridge).toContain('var untouched = 42')
  })

  it('does not redeclare array bindings or rest bindings', () => {
    const code = `
const [first, second = 2, ...remaining] = values
console.log(first, second, remaining, serverOnly)
`
    const bridge = generateServerDataBridge(code, {
      first: 1,
      second: 2,
      remaining: [3],
      serverOnly: true,
    })

    expect(bridge).not.toContain('var first')
    expect(bridge).not.toContain('var second')
    expect(bridge).not.toContain('var remaining')
    expect(bridge).toContain('var serverOnly = true')
  })
})
