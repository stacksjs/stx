import { describe, expect, it } from 'bun:test'
import { SIGNALS_COMPONENT_API_RUNTIME } from '../../src/client/signals-component-api-runtime'
import { SIGNALS_EVENT_SHORTHAND_RUNTIME } from '../../src/client/signals-event-shorthand-runtime'
import { createComponentInstance, defineEmits, setCurrentInstance } from '../../src/composition-api'
import { generateSignalsRuntimeDev } from '../../src/signals'

describe('signals component API runtime boundary', () => {
  it('assembles the component API fragment exactly once', () => {
    const runtime = generateSignalsRuntimeDev()
    const first = runtime.indexOf(SIGNALS_COMPONENT_API_RUNTIME)

    expect(first).toBeGreaterThan(-1)
    expect(runtime.indexOf(SIGNALS_COMPONENT_API_RUNTIME, first + 1)).toBe(-1)
  })

  it('keeps props, emits, expose, and slots together', () => {
    expect(SIGNALS_COMPONENT_API_RUNTIME).toContain('defineProps: function')
    expect(SIGNALS_COMPONENT_API_RUNTIME).toContain('defineEmits: function')
    expect(SIGNALS_COMPONENT_API_RUNTIME).toContain('defineExpose: function')
    expect(SIGNALS_COMPONENT_API_RUNTIME).toContain('useSlots: function')
  })

  it('retains every emitted argument in both component API paths', () => {
    const element = document.createElement('div')
    const seen: any[] = []
    element.addEventListener('saved', event => seen.push(event))
    const generated = new Function('window', 'document', 'CustomEvent', 'stxHost', `return ({${SIGNALS_COMPONENT_API_RUNTIME}})`)(
      { __STX_CURRENT_ELEMENT__: element }, document, CustomEvent,
      { emitComponentEvent: (node: HTMLElement, event: Event) => node.dispatchEvent(event) },
    )
    const instance = createComponentInstance()
    instance.el = element
    setCurrentInstance(instance)
    try {
      const importedEmit = defineEmits(['saved'])
      const runtimeEmit = generated.defineEmits(['saved'])
      const values = { name: 'Ada' }
      const helpers = { resetForm() {} }
      for (const emit of [importedEmit, runtimeEmit]) {
        emit('saved', values, helpers)
        expect(seen.at(-1).__stx_emit_args).toEqual([values, helpers])
        expect(seen.at(-1).__stx_emit_args[1]).toBe(helpers)
        emit('saved', values)
        expect(seen.at(-1).__stx_emit_args).toEqual([values])
        expect(seen.at(-1).detail).toBe(values)
      }
    }
    finally { setCurrentInstance(null) }
  })

  it('passes emitted arguments through bare function handlers', () => {
    const parse = new Function(`${SIGNALS_EVENT_SHORTHAND_RUNTIME}\nreturn parseEventShorthand`)()
    const received: unknown[][] = []
    const handler = parse('save', { save: (...args: unknown[]) => received.push(args) })
    const helpers = { resetForm() {} }
    handler({ name: 'Ada' }, helpers)
    expect(received).toEqual([[{ name: 'Ada' }, helpers]])
    expect(received[0][1]).toBe(helpers)
  })
})
