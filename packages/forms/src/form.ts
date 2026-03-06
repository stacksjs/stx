import type { FieldState, FormConfig, FormInstance } from './types'
import type { Validator } from './validator'

export function useForm<T extends Record<string, unknown>>(config: FormConfig<T>): FormInstance<T> {
  const values = { ...config.initial }
  const errors: Record<string, string[]> = {}
  const touched: Record<string, boolean> = {}
  const dirty: Record<string, boolean> = {}
  let isSubmitting = false

  // Initialize errors for all fields
  for (const key of Object.keys(config.initial)) {
    errors[key] = []
    touched[key] = false
    dirty[key] = false
  }

  async function validateField(field: string): Promise<string[]> {
    if (!config.validation || !(field in config.validation))
      return []

    const validator = config.validation[field as keyof T] as Validator
    if (!validator || typeof validator.validate !== 'function')
      return []

    return validator.validate(values[field as keyof T], values as Record<string, unknown>)
  }

  async function validateAll(): Promise<boolean> {
    let allValid = true

    for (const field of Object.keys(values)) {
      const fieldErrors = await validateField(field)
      errors[field] = fieldErrors
      if (fieldErrors.length > 0)
        allValid = false
    }

    return allValid
  }

  const instance: FormInstance<T> = {
    get values() {
      return { ...values }
    },

    get errors() {
      return { ...errors } as Record<keyof T, string[]>
    },

    get isValid() {
      return Object.values(errors).every((e: string[]) => e.length === 0)
    },

    get isSubmitting() {
      return isSubmitting
    },

    get isDirty() {
      return Object.values(dirty).some(Boolean)
    },

    async submit(_e?: Event) {
      isSubmitting = true
      try {
        const valid = await validateAll()
        if (!valid) {
          if (config.onError) {
            config.onError(errors as Record<string, string[]>)
          }
          return
        }
        if (config.onSuccess) {
          config.onSuccess(values)
        }
      }
      finally {
        isSubmitting = false
      }
    },

    reset() {
      for (const key of Object.keys(config.initial)) {
        ;(values as any)[key] = config.initial[key as keyof T]
        errors[key] = []
        touched[key] = false
        dirty[key] = false
      }
    },

    setFieldValue(field: keyof T, value: unknown) {
      ;(values as any)[field] = value
      dirty[field as string] = value !== config.initial[field]
      touched[field as string] = true
    },

    getFieldState(field: keyof T): FieldState {
      return {
        value: values[field],
        errors: errors[field as string] ?? [],
        touched: touched[field as string] ?? false,
        dirty: dirty[field as string] ?? false,
        valid: (errors[field as string] ?? []).length === 0,
      }
    },
  }

  return instance
}

export function defineForm<T extends Record<string, unknown>>(
  schema: Record<keyof T, Validator>,
): FormConfig<T> {
  const initial = {} as T
  for (const [key, validator] of Object.entries(schema)) {
    ;(initial as any)[key] = (validator as Validator).getDefaultValue() ?? ''
  }

  return {
    initial,
    validation: schema as Record<keyof T, any>,
  }
}
