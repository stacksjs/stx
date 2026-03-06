export type ValidatorFn = (value: unknown, formValues?: Record<string, unknown>) => true | string
export type AsyncValidatorFn = (value: unknown, formValues?: Record<string, unknown>) => Promise<true | string>

export interface ValidatorRule {
  name: string
  validate: ValidatorFn | AsyncValidatorFn
  message: string
  async?: boolean
}

export interface FieldState {
  value: unknown
  errors: string[]
  touched: boolean
  dirty: boolean
  valid: boolean
}

export interface FormConfig<T extends Record<string, unknown>> {
  initial: T
  validation?: Record<keyof T, any>
  onSuccess?: (result: any) => void
  onError?: (errors: Record<string, string[]>) => void
}

export interface FormInstance<T extends Record<string, unknown>> {
  values: T
  errors: Record<keyof T, string[]>
  isValid: boolean
  isSubmitting: boolean
  isDirty: boolean
  submit: (e?: Event) => Promise<void>
  reset: () => void
  setFieldValue: (field: keyof T, value: unknown) => void
  getFieldState: (field: keyof T) => FieldState
}
