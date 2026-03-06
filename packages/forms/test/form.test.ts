import { describe, expect, test } from 'bun:test'
import { useForm, v } from '../src'

describe('useForm', () => {
  test('creates form with initial values', () => {
    const form = useForm({
      initial: { name: 'John', email: 'john@test.com' },
    })
    expect(form.values.name).toBe('John')
    expect(form.values.email).toBe('john@test.com')
  })

  test('isValid is true initially (no errors)', () => {
    const form = useForm({
      initial: { name: '' },
    })
    expect(form.isValid).toBe(true)
  })

  test('isDirty is false initially', () => {
    const form = useForm({
      initial: { name: 'John' },
    })
    expect(form.isDirty).toBe(false)
  })

  test('isSubmitting is false initially', () => {
    const form = useForm({
      initial: { name: 'John' },
    })
    expect(form.isSubmitting).toBe(false)
  })

  test('setFieldValue updates value', () => {
    const form = useForm({
      initial: { name: 'John' },
    })
    form.setFieldValue('name', 'Jane')
    expect(form.values.name).toBe('Jane')
  })

  test('setFieldValue marks field as dirty', () => {
    const form = useForm({
      initial: { name: 'John' },
    })
    form.setFieldValue('name', 'Jane')
    expect(form.isDirty).toBe(true)
  })

  test('setFieldValue to same value is not dirty', () => {
    const form = useForm({
      initial: { name: 'John' },
    })
    form.setFieldValue('name', 'John')
    expect(form.isDirty).toBe(false)
  })

  test('setFieldValue marks field as touched', () => {
    const form = useForm({
      initial: { name: 'John' },
    })
    form.setFieldValue('name', 'Jane')
    const state = form.getFieldState('name')
    expect(state.touched).toBe(true)
  })

  test('getFieldState returns field info', () => {
    const form = useForm({
      initial: { name: 'John' },
    })
    const state = form.getFieldState('name')
    expect(state.value).toBe('John')
    expect(state.errors).toEqual([])
    expect(state.touched).toBe(false)
    expect(state.dirty).toBe(false)
    expect(state.valid).toBe(true)
  })

  test('reset restores initial values', () => {
    const form = useForm({
      initial: { name: 'John', email: 'john@test.com' },
    })
    form.setFieldValue('name', 'Jane')
    form.setFieldValue('email', 'jane@test.com')
    expect(form.isDirty).toBe(true)

    form.reset()
    expect(form.values.name).toBe('John')
    expect(form.values.email).toBe('john@test.com')
    expect(form.isDirty).toBe(false)
  })

  test('submit calls onSuccess with valid form', async () => {
    let result: any = null
    const form = useForm({
      initial: { name: 'John' },
      onSuccess: (data) => { result = data },
    })
    await form.submit()
    expect(result).toEqual({ name: 'John' })
  })

  test('submit calls onError when validation fails', async () => {
    let errorResult: any = null
    const form = useForm({
      initial: { name: '' },
      validation: { name: v.required() },
      onError: (errors) => { errorResult = errors },
    })
    await form.submit()
    expect(errorResult).toBeDefined()
    expect(errorResult.name.length).toBeGreaterThan(0)
  })

  test('submit with validation sets errors', async () => {
    const form = useForm({
      initial: { email: 'bad' },
      validation: { email: v.required().email() },
      onError: () => {},
    })
    await form.submit()
    expect(form.errors.email.length).toBeGreaterThan(0)
  })
})
