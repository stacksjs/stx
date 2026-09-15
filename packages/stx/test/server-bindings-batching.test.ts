import { describe, expect, it } from 'bun:test'
import { processServerBindings } from '../src/server-bindings'

describe('server binding batching', () => {
  it('resolves repeated tags without moving the markup between them', () => {
    const template = '<header>top</header><a :href="url">one</a><span>middle</span><a :href="url">two</a><footer>bottom</footer>'
    const output = processServerBindings(template, { url: '/items' })

    expect(output).toBe('<header>top</header><a href="/items">one</a><span>middle</span><a href="/items">two</a><footer>bottom</footer>')
  })

  it('passes current values to a reused function after a context getter changes state', () => {
    const context = { count: 0 } as Record<string, any>
    Object.defineProperty(context, 'tick', {
      enumerable: true,
      get() {
        context.count++
        return undefined
      },
    })
    const template = '<p :data-count="count"></p><p :data-count="count"></p>'

    expect(processServerBindings(template, context)).toBe('<p data-count="0"></p><p data-count="1"></p>')
  })

  it('recompiles when a getter changes the ordered context keys', () => {
    const context: Record<string, any> = { a: 10, b: 3 }
    let moved = false
    Object.defineProperty(context, 'move', {
      enumerable: true,
      get() {
        if (!moved) {
          delete context.a
          context.a = 20
          moved = true
        }
        return undefined
      },
    })
    const template = '<i :data-value="a - b"></i><i :data-value="a - b"></i>'

    expect(processServerBindings(template, context)).toBe('<i data-value="7"></i><i data-value="17"></i>')
  })
})
