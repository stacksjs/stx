/**
 * useForm — reactive form state reachable from a <script client> block
 * (stacksjs/stx#1846, renamed in #1843).
 *
 * Named `defineForm` until it turned out to be the odd one out. In this
 * codebase `define*` DECLARES — defineProps, defineEmits, defineExpose,
 * definePageMeta, defineSlots, defineStore — while `use*` returns live reactive
 * state: useFetch, useCookie, useMutation, useDark. This returns signal-backed
 * state and a handleSubmit, so it was a `use*` wearing a `define*` name, and the
 * file being called use-form.ts while exporting defineForm meant grepping for
 * either one found the wrong half.
 *
 * It also collided with an independently written `useForm` in
 * @stacksjs/composables, which is the same primitive built twice because neither
 * side could find the other's — the adoption problem in #1843, applied to the
 * framework itself.
 *
 * `defineForm` remains as a deprecated alias below.
 *
 * Lifted out of forms-validation.ts so the framework-composables demand-bundler
 * (src/framework-composables.ts) can ship it to the browser. That bundler scans
 * THIS directory, takes each file whole, strips the imports — every name they
 * pull from stx is a runtime global by the time the emitted script runs — and
 * merges the export onto window.stx. defineForm was exported from the package
 * and type-checked, yet reached the client by no path at all, so an app that
 * wanted reactive form state hand-rolled it. #1856 made it reactive; this makes
 * it reachable.
 *
 * The signal comes from signals-api, whose `state` is published as a bare global
 * (signals.ts does `window.state = state`), so the stripped `import { state }`
 * below still resolves once the bundle runs. reactivity.ts's `reactive()` would
 * NOT — it tracks a separate effect context the template runtime never reads
 * (see #1885).
 */
import type { FieldState, FormState, Validator } from '../forms-validation'
import { state } from '../signals-api'

/**
 * A record whose properties are each backed by their own signal.
 *
 * Reads go through the signal, so touching `record.field` inside an effect (or a
 * template binding, which compiles to one) subscribes to that field alone --
 * changing `email` does not invalidate a binding that only read `password`.
 * Writes go through `.set`, so ordinary assignment (`record.field = x`) notifies
 * subscribers without the caller knowing a signal is involved.
 *
 * `ownKeys` / `getOwnPropertyDescriptor` are implemented so that Object.keys,
 * spread and JSON.stringify still see a plain-looking object; without them a
 * snapshot of the form would come back empty.
 */
function signalRecord<K extends string | number | symbol>(
  fields: K[],
  init: (field: K) => unknown,
): Record<K, any> {
  const signals: Record<string | symbol, ReturnType<typeof state>> = {}
  for (const field of fields)
    signals[field as string | symbol] = state(init(field))

  return new Proxy({} as Record<K, any>, {
    get: (_target, prop) => signals[prop]?.(),
    set: (_target, prop, value) => {
      if (signals[prop])
        signals[prop].set(value)
      else
        signals[prop] = state(value)
      return true
    },
    has: (_target, prop) => prop in signals,
    deleteProperty: (_target, prop) => {
      delete signals[prop]
      return true
    },
    ownKeys: () => Reflect.ownKeys(signals),
    getOwnPropertyDescriptor: (_target, prop) =>
      prop in signals
        ? { enumerable: true, configurable: true, writable: true, value: signals[prop]() }
        : undefined,
  })
}

/** Plain, non-reactive copy of a signal-backed record. */
function snapshot<K extends string | number | symbol>(record: Record<K, any>, fields: K[]): Record<K, any> {
  const out = {} as Record<K, any>
  for (const field of fields)
    out[field] = record[field]
  return out
}

/**
 * Reactive form state from a validation schema.
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   email: v.required().email(),
 *   password: v.required().min(8),
 *   age: v.number().between(18, 100)
 * })
 *
 * // Access form state
 * form.values.email
 * form.errors.email
 * form.isValid
 *
 * // Validate
 * await form.validate()
 *
 * // Handle submit
 * form.handleSubmit((values) => {
 *   console.log(values)
 * })
 * ```
 */
export function useForm<T extends Record<string, Validator>>(
  schema: T,
  initialValues?: Partial<{ [K in keyof T]: unknown }>
): FormState<T> {
  const fields = Object.keys(schema) as (keyof T)[]

  // Initialize state.
  //
  // Every container is backed by one signal per field, behind a proxy that reads
  // through the signal on get and writes through it on set. That keeps the
  // documented ergonomics -- `form.values.email`, `form.errors.email` -- while
  // making them actually reactive, which is what the "Create reactive form state"
  // comment below has always claimed and never delivered: these were plain
  // objects, so a template that rendered form.errors.email showed the value once
  // and never updated. See #1856.
  //
  // The signal comes from signals-api, NOT from reactivity.ts's reactive(). Those
  // are two separate tracking systems -- reactive() subscribes its own private
  // currentEffect (reactivity.ts:119), while the client runtime ships effect()
  // from signals-api (signals.ts:11). Wrapping these in reactive() would look
  // correct and still never notify a template.
  const values = signalRecord(fields, f => initialValues?.[f] ?? schema[f].getDefaultValue())
  const errors = signalRecord(fields, () => [] as string[])
  const touched = signalRecord(fields, () => false)
  const dirty = signalRecord(fields, () => false)
  const validating = signalRecord(fields, () => false)

  const isValidatingSignal = state(false)

  // Validate a single field
  async function validateField(field: keyof T): Promise<boolean> {
    validating[field] = true
    const fieldErrors = await schema[field].validate(values[field], values as Record<string, unknown>)
    errors[field] = fieldErrors
    validating[field] = false
    return fieldErrors.length === 0
  }

  // Validate all fields
  async function validate(): Promise<boolean> {
    isValidatingSignal.set(true)
    const results = await Promise.all(fields.map(validateField))
    isValidatingSignal.set(false)
    return results.every(Boolean)
  }

  // Reset form to initial state
  function reset(): void {
    for (const field of fields) {
      values[field] = initialValues?.[field] ?? schema[field].getDefaultValue()
      errors[field] = []
      touched[field] = false
      dirty[field] = false
    }
  }

  // Set multiple values
  function setValues(newValues: Partial<{ [K in keyof T]: unknown }>): void {
    for (const field of fields) {
      if (field in newValues) {
        values[field] = newValues[field]
        dirty[field] = true
      }
    }
  }

  // Set a single field value
  function setFieldValue(field: keyof T, value: unknown): void {
    values[field] = value
    dirty[field] = true
  }

  // Set field touched state
  function setFieldTouched(field: keyof T, isTouched = true): void {
    touched[field] = isTouched
    if (isTouched) {
      validateField(field)
    }
  }

  // Get field state
  function getFieldState(field: keyof T): FieldState {
    return {
      value: values[field],
      errors: errors[field],
      touched: touched[field],
      dirty: dirty[field],
      valid: errors[field].length === 0,
      validating: validating[field]
    }
  }

  // Handle form submission
  function handleSubmit(
    onSubmit: (values: { [K in keyof T]: unknown }) => void | Promise<void>
  ): (e?: Event) => Promise<void> {
    return async (e?: Event) => {
      e?.preventDefault?.()

      // Mark all fields as touched
      for (const field of fields) {
        touched[field] = true
      }

      const valid = await validate()
      if (valid) {
        await onSubmit(snapshot(values, fields))
      }
    }
  }

  // Create reactive form state
  const form: FormState<T> = {
    values,
    errors,
    touched,
    dirty,
    get isValid() {
      return fields.every(f => errors[f].length === 0)
    },
    get isValidating() {
      return isValidatingSignal() || fields.some(f => validating[f])
    },
    get isDirty() {
      return fields.some(f => dirty[f])
    },
    validate,
    validateField,
    reset,
    setValues,
    setFieldValue,
    setFieldTouched,
    getFieldState,
    handleSubmit
  }

  return form
}

/**
 * @deprecated Use {@link useForm}. Renamed in stacksjs/stx#1843 so the name
 * matches what it does: `define*` declares in this codebase, `use*` returns
 * live reactive state, and this returns the latter.
 *
 * A plain alias, not a wrapper — same reference, so `defineForm === useForm`
 * and anything comparing or spying on the function keeps working. Kept for a
 * minor; existing apps do not have to move in the same release they upgrade in.
 */
export const defineForm = useForm
