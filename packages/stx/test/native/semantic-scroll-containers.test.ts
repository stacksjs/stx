import { describe, expect, it } from 'bun:test'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'

describe('scrolling semantic page containers', () => {
  it('keeps a scrolling main so the host can reach content above its keyboard', async () => {
    const { root } = await translateHtmlToIR('<main class="overflow-y-auto py-10"><form><input type="email"><button>Sign in</button></form></main>')
    expect(root.type).toBe('ScrollView')
    expect(root.style.paddingVertical).toBe(40)
    expect(root.children[0]).toMatchObject({ type: 'View', props: { 'data-stx-form': true } })
  })

  it('keeps a horizontal scrolling main and an explicit native wrapper', async () => {
    const horizontal = await translateHtmlToIR('<main class="overflow-x-auto"><button>Choice</button></main>')
    expect(horizontal.root).toMatchObject({ type: 'ScrollView', props: { horizontal: true } })
    const explicit = await translateHtmlToIR('<main data-native="KeyboardAvoidingView"><input></main>')
    expect(explicit.root.type).toBe('KeyboardAvoidingView')
    expect(explicit.root.children[0]).toMatchObject({ type: 'TextInput' })
  })

  it('still unwraps ordinary document wrappers', async () => {
    const { root } = await translateHtmlToIR('<html><body><main><input type="email"></main></body></html>')
    expect(root.type).toBe('TextInput')
  })
})
