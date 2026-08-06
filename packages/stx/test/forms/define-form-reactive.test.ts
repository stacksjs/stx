import { describe, expect, it } from 'bun:test'
// Imported from the PACKAGE ENTRY on purpose. defineForm and `v` existed since the
// module landed but were never re-exported, so `import { defineForm } from 'stx'`
// -- the exact line the module's own docblock tells you to write -- threw. See #1856.
import { defineForm, effect, v } from '../../src/index'

describe('defineForm: reachable and reactive (#1856)', () => {
  it('is exported from the package entry', () => {
    expect(typeof defineForm).toBe('function')
    expect(v).toBeDefined()
  })

  it('still exposes the documented property access', () => {
    const form = defineForm({ email: v.required().email() }, { email: 'a@b.co' })
    expect(form.values.email).toBe('a@b.co')
    expect(form.errors.email).toEqual([])
    expect(form.isValid).toBe(true)
  })

  it('notifies an effect when a field value changes', () => {
    // This is the whole point of the fix. The containers used to be plain objects,
    // so a template binding rendered once and never updated.
    const form = defineForm({ email: v.required().email() })
    const seen: unknown[] = []

    effect(() => {
      seen.push(form.values.email)
    })

    expect(seen.length).toBe(1)
    form.setFieldValue('email', 'new@example.com')
    expect(seen.length).toBe(2)
    expect(seen[1]).toBe('new@example.com')
  })

  it('notifies an effect when validation writes errors', async () => {
    const form = defineForm({ email: v.required().email() })
    const seen: string[][] = []

    effect(() => {
      seen.push([...form.errors.email])
    })

    expect(seen.length).toBe(1)
    await form.validate()
    expect(seen.length).toBeGreaterThan(1)
    expect(seen[seen.length - 1].length).toBeGreaterThan(0)
  })

  it('tracks per field, so an unrelated field does not invalidate a binding', () => {
    const form = defineForm({ email: v.required(), password: v.required() })
    let emailReads = 0

    effect(() => {
      void form.values.email
      emailReads++
    })

    expect(emailReads).toBe(1)
    form.setFieldValue('password', 'hunter2')
    expect(emailReads).toBe(1)
    form.setFieldValue('email', 'x@y.co')
    expect(emailReads).toBe(2)
  })

  it('keeps the record enumerable, so a snapshot is not empty', () => {
    const form = defineForm({ email: v.required(), password: v.required() }, { email: 'a@b.co', password: 'pw' })
    expect(Object.keys(form.values).sort()).toEqual(['email', 'password'])
    expect({ ...form.values }).toEqual({ email: 'a@b.co', password: 'pw' })
    expect(JSON.parse(JSON.stringify(form.values))).toEqual({ email: 'a@b.co', password: 'pw' })
  })

  it('hands handleSubmit a plain snapshot, not the live proxy', async () => {
    const form = defineForm({ email: v.required().email() }, { email: 'a@b.co' })
    let received: any = null

    await form.handleSubmit((values) => {
      received = values
    })()

    expect(received).toEqual({ email: 'a@b.co' })
    // A later write must not retroactively change what the handler was given.
    form.setFieldValue('email', 'changed@example.com')
    expect(received.email).toBe('a@b.co')
  })

  it('reflects dirty/touched through the same tracking', () => {
    const form = defineForm({ email: v.required() })
    const seen: boolean[] = []

    effect(() => {
      seen.push(form.isDirty)
    })

    expect(seen[0]).toBe(false)
    form.setFieldValue('email', 'x@y.co')
    expect(seen[seen.length - 1]).toBe(true)
  })

  it('reset() restores initial values and notifies', () => {
    const form = defineForm({ email: v.required() }, { email: 'start@x.co' })
    form.setFieldValue('email', 'changed@x.co')
    expect(form.values.email).toBe('changed@x.co')

    form.reset()
    expect(form.values.email).toBe('start@x.co')
    expect(form.isDirty).toBe(false)
  })
})
