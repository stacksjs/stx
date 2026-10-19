import { describe, expect, it } from 'bun:test'
import { NativeFormData } from '../../src/native/runtime/jsc-globals'
import { createNativeHost, type NativeNode } from '../../src/native/runtime/native-host'

function fixture() {
  const host = createNativeHost({ send() {} })
  const add = (id: string, type: string, props: Record<string, unknown>, owner?: NativeNode) =>
    host.adopt({ __stxId: id }, type, owner, { props, style: {}, events: {}, children: [] })
  const form = add('form', 'View', { 'data-stx-form': true })
  const input = add('input', 'TextInput', { name: 'name', value: 'Ada' }, form)
  const button = add('submit', 'Button', { type: 'submit' }, form)
  const fire = (node: NativeNode, event: string, payload: unknown = {}) => {
    const id = host.snapshot(node).events[event]
    expect(id).toBeTruthy()
    host.dispatch(id, payload)
  }
  return { host, add, form, input, button, fire }
}

describe('native form host semantics (#2088)', () => {
  it('collects successful controls and delivers delegated edits before submit', () => {
    const { host, add, form, input, button, fire } = fixture()
    add('hidden', 'View', { type: 'hidden', name: 'token', value: 'secret' }, form)
    add('checked', 'Checkbox', { type: 'checkbox', name: 'agree', formValue: 'yes', checked: true, value: true }, form)
    add('unchecked', 'Checkbox', { type: 'checkbox', name: 'omitted', checked: false }, form)
    add('disabled', 'TextInput', { name: 'disabled', value: 'omitted', disabled: true }, form)
    add('unnamed', 'TextInput', { value: 'omitted' }, form)
    const edits: unknown[] = []
    const submissions: unknown[] = []
    host.listen(form, 'input', (event: any) => edits.push([event.target.name, event.target.value, event.currentTarget === form]))
    host.listen(form, 'submit', (event: any) => submissions.push([...new NativeFormData(event.target)]))
    fire(input, 'onChangeText', { text: 'Grace' })
    fire(button, 'onPress')
    expect(edits).toEqual([['name', 'Grace', true]])
    expect(submissions).toEqual([[['name', 'Grace'], ['token', 'secret'], ['agree', 'yes']]])
  })

  it('lets preventDefault cancel submit without confusing stopPropagation with cancellation', () => {
    const { host, form, button, fire } = fixture()
    let submissions = 0
    host.listen(form, 'submit', () => submissions++)
    host.listen(form, 'click', (event: any) => event.stopPropagation(), { capture: true })
    fire(button, 'onPress')
    expect(submissions).toBe(1)
    host.listen(form, 'click', (event: any) => event.preventDefault(), { capture: true })
    fire(button, 'onPress')
    expect(submissions).toBe(1)
    host.setAttribute(button, 'disabled', true)
    fire(button, 'onPress')
    expect(submissions).toBe(1)
  })

  it('gives cloned controls their own default-action handler and releases it on teardown', () => {
    const { host, form, button, fire } = fixture()
    const submitters: NativeNode[] = []
    host.listen(form, 'submit', (event: any) => submitters.push(event.submitter))
    const copy = host.clone(button)
    host.insert(form, copy)
    expect(host.snapshot(copy).events.onPress).not.toBe(host.snapshot(button).events.onPress)
    fire(copy, 'onPress')
    expect(submitters).toEqual([copy])
    const id = host.snapshot(copy).events.onPress
    host.dispose()
    host.dispatch(id, {})
    expect(submitters).toHaveLength(1)
  })

  it('resets control values and excludes removed controls from collection', () => {
    const { host, add, form, input, fire } = fixture()
    const reset = add('reset', 'Button', { type: 'reset' }, form)
    fire(input, 'onChangeText', { text: 'Grace' })
    expect(new NativeFormData(form).get('name')).toBe('Grace')
    fire(reset, 'onPress')
    expect(new NativeFormData(form).get('name')).toBe('Ada')
    host.remove(input)
    expect(new NativeFormData(form).has('name')).toBe(false)
  })

  it('notifies model resets only after an uncanceled reset and unsubscribes cleanly', () => {
    const { host, form, input, fire } = fixture()
    const restored: unknown[] = []
    const stop = host.onFormReset(input, () => restored.push(new NativeFormData(form).get('name')))
    fire(input, 'onChangeText', { text: 'Grace' })
    host.listen(form, 'reset', (event: any) => event.preventDefault(), { once: true })
    ;(form as any).reset()
    expect(new NativeFormData(form).get('name')).toBe('Grace')
    expect(restored).toEqual([])
    ;(form as any).reset()
    expect(restored).toEqual(['Ada'])
    stop()
    ;(form as any).reset()
    expect(restored).toEqual(['Ada'])
  })
})
