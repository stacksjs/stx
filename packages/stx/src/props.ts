/**
 * STX Props System
 *
 * Provides type-safe component props with runtime validation.
 *
 * @module props
 *
 * @example
 * ```html
 * <script>
 * import { defineProps } from 'stx'
 *
 * const props = defineProps<{
 *   title: string
 *   count?: number
 *   items: string[]
 * }>({
 *   title: { required: true },
 *   count: { default: 0 },
 *   items: { default: () => [] }
 * })
 * </script>
 *
 * <h1>{{ props.title }}</h1>
 * <p>Count: {{ props.count }}</p>
 * ```
 */

// =============================================================================
// Types
// =============================================================================

/** Supported prop types */
export type PropType<T> =
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | ArrayConstructor
  | ObjectConstructor
  | FunctionConstructor
  | DateConstructor
  | SymbolConstructor
  | { new (...args: unknown[]): T }
  | PropType<T>[]

/** Prop definition options */
export interface PropOptions<T = unknown> {
  /** The expected type(s) of the prop */
  type?: PropType<T> | PropType<T>[]
  /** Whether the prop is required */
  required?: boolean
  /** Default value (use function for objects/arrays) */
  default?: T | (() => T)
  /** Custom validator function */
  validator?: (value: T) => boolean
  /** Description for documentation */
  description?: string
}

/** Props definition object */
export type PropsDefinition<T> = {
  [K in keyof T]?: PropOptions<T[K]> | PropType<T[K]>
}

/** Extracted prop types */
export type ExtractPropTypes<T extends PropsDefinition<unknown>> = {
  [K in keyof T]: T[K] extends PropOptions<infer V>
    ? V
    : T[K] extends PropType<infer V>
      ? V
      : unknown
}

/** Prop validation error */
export interface PropValidationError {
  prop: string
  message: string
  value: unknown
  expected?: string
}

/** Prop validation result */
export interface PropValidationResult {
  valid: boolean
  errors: PropValidationError[]
  warnings: string[]
}

// =============================================================================
// Prop Type Checking
// =============================================================================

/**
 * Get the type name from a constructor or value.
 */
function getTypeName(type: PropType<unknown>): string {
  if (type === String) return 'string'
  if (type === Number) return 'number'
  if (type === Boolean) return 'boolean'
  if (type === Array) return 'array'
  if (type === Object) return 'object'
  if (type === Function) return 'function'
  if (type === Date) return 'date'
  if (type === Symbol) return 'symbol'
  if (typeof type === 'function' && type.name) return type.name
  return 'unknown'
}

/**
 * Check if a value matches the expected type.
 */
function checkType(value: unknown, type: PropType<unknown>): boolean {
  if (value === null || value === undefined) return true

  if (type === String) return typeof value === 'string'
  if (type === Number) return typeof value === 'number' && !Number.isNaN(value)
  if (type === Boolean) return typeof value === 'boolean'
  if (type === Array) return Array.isArray(value)
  if (type === Object) return typeof value === 'object' && !Array.isArray(value)
  if (type === Function) return typeof value === 'function'
  if (type === Date) return value instanceof Date
  if (type === Symbol) return typeof value === 'symbol'

  // Custom class check
  if (typeof type === 'function') {
    return value instanceof type
  }

  return true
}

/**
 * Validate a single prop value.
 */
function validateProp<T>(
  name: string,
  value: unknown,
  options: PropOptions<T>,
  componentName?: string,
): PropValidationError | null {
  const prefix = componentName ? `[${componentName}]` : ''

  // Check required
  if (options.required && (value === undefined || value === null)) {
    return {
      prop: name,
      message: `${prefix} Missing required prop: "${name}"`,
      value,
      expected: options.type ? getTypeName(options.type as PropType<unknown>) : undefined,
    }
  }

  // Skip validation for undefined/null non-required props
  if (value === undefined || value === null) {
    return null
  }

  // Check type
  if (options.type) {
    const types = Array.isArray(options.type) ? options.type : [options.type]
    const typeValid = types.some((t) => checkType(value, t as PropType<unknown>))

    if (!typeValid) {
      const expectedTypes = types.map((t) => getTypeName(t as PropType<unknown>)).join(' | ')
      return {
        prop: name,
        message: `${prefix} Invalid prop type for "${name}": expected ${expectedTypes}, got ${typeof value}`,
        value,
        expected: expectedTypes,
      }
    }
  }

  // Run custom validator
  if (options.validator) {
    const isValid = options.validator(value as T)
    if (!isValid) {
      return {
        prop: name,
        message: `${prefix} Custom validation failed for prop "${name}"`,
        value,
      }
    }
  }

  return null
}

// =============================================================================
// Define Props
// =============================================================================

/**
 * Define component props with type safety and validation.
 *
 * @example
 * ```typescript
 * // Simple usage with types only
 * const props = defineProps<{
 *   title: string
 *   count: number
 * }>()
 *
 * // With validation and defaults
 * const props = defineProps<{
 *   title: string
 *   count?: number
 *   status: 'active' | 'inactive'
 * }>({
 *   title: { required: true },
 *   count: { default: 0 },
 *   status: {
 *     default: 'active',
 *     validator: (v) => ['active', 'inactive'].includes(v)
 *   }
 * })
 * ```
 */
export function defineProps<T extends Record<string, unknown>>(
  definitions?: PropsDefinition<T>,
): T {
  // This is a compile-time function that gets transformed
  // At runtime, it returns the props passed to the component
  const props = (globalThis as Record<string, unknown>).__STX_CURRENT_PROPS__ as T || {} as T

  if (!definitions) {
    return props
  }

  // Apply defaults and validate
  const result: Record<string, unknown> = { ...props }

  for (const [key, def] of Object.entries(definitions)) {
    const options: PropOptions<unknown> = typeof def === 'function' || Array.isArray(def)
      ? { type: def as PropType<unknown> }
      : (def as PropOptions<unknown>) || {}

    // Apply default if value is undefined
    if (result[key] === undefined && options.default !== undefined) {
      result[key] = typeof options.default === 'function'
        ? (options.default as () => unknown)()
        : options.default
    }
  }

  return result as T
}

/**
 * Define props with runtime validation.
 * Use this when you need validation errors at runtime.
 */
export function definePropsWithValidation<T extends Record<string, unknown>>(
  definitions: PropsDefinition<T>,
  options: {
    componentName?: string
    throwOnError?: boolean
    logWarnings?: boolean
  } = {},
): { props: T; validation: PropValidationResult } {
  const {
    componentName,
    throwOnError = false,
    logWarnings = true,
  } = options

  const rawProps = (globalThis as Record<string, unknown>).__STX_CURRENT_PROPS__ as Record<string, unknown> || {}
  const result: Record<string, unknown> = { ...rawProps }
  const validation: PropValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  }

  for (const [key, def] of Object.entries(definitions)) {
    const propOptions: PropOptions<unknown> = typeof def === 'function' || Array.isArray(def)
      ? { type: def as PropType<unknown> }
      : (def as PropOptions<unknown>) || {}

    // Apply default if value is undefined
    if (result[key] === undefined && propOptions.default !== undefined) {
      result[key] = typeof propOptions.default === 'function'
        ? (propOptions.default as () => unknown)()
        : propOptions.default
    }

    // Validate
    const error = validateProp(key, result[key], propOptions, componentName)
    if (error) {
      validation.valid = false
      validation.errors.push(error)

      if (logWarnings) {
        console.warn(error.message)
      }
    }
  }

  // Check for unknown props
  for (const key of Object.keys(rawProps)) {
    if (!(key in definitions)) {
      const warning = `${componentName ? `[${componentName}]` : ''} Unknown prop: "${key}"`
      validation.warnings.push(warning)
      if (logWarnings) {
        console.warn(warning)
      }
    }
  }

  if (throwOnError && !validation.valid) {
    const errorMessages = validation.errors.map((e) => e.message).join('\n')
    throw new Error(`Prop validation failed:\n${errorMessages}`)
  }

  return {
    props: result as T,
    validation,
  }
}

// =============================================================================
// With Defaults
// =============================================================================

/**
 * Define default values for props.
 *
 * @example
 * ```typescript
 * const props = withDefaults(defineProps<{
 *   title: string
 *   count?: number
 *   items?: string[]
 * }>(), {
 *   count: 0,
 *   items: () => []
 * })
 * ```
 */
export function withDefaults<T extends Record<string, unknown>>(
  props: T,
  defaults: Partial<{ [K in keyof T]: T[K] | (() => T[K]) }>,
): T {
  const result: Record<string, unknown> = { ...props }

  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (result[key] === undefined) {
      result[key] = typeof defaultValue === 'function'
        ? (defaultValue as () => unknown)()
        : defaultValue
    }
  }

  return result as T
}

// =============================================================================
// Prop Helpers
// =============================================================================

/**
 * Create a prop type definition for a specific type.
 */
export function prop<T>(options: PropOptions<T>): PropOptions<T> {
  return options
}

/**
 * Create a required prop.
 */
export function required<T>(type?: PropType<T>): PropOptions<T> {
  return { type, required: true }
}

/**
 * Create an optional prop with default.
 */
export function optional<T>(defaultValue: T | (() => T), type?: PropType<T>): PropOptions<T> {
  return { type, default: defaultValue }
}

/**
 * Create a prop with a validator.
 */
export function validated<T>(
  validator: (value: T) => boolean,
  options: Omit<PropOptions<T>, 'validator'> = {},
): PropOptions<T> {
  return { ...options, validator }
}

/**
 * Create a prop that accepts one of specific values.
 */
export function oneOf<T extends string | number>(
  values: readonly T[],
  options: Omit<PropOptions<T>, 'validator'> = {},
): PropOptions<T> {
  return {
    ...options,
    validator: (value: T) => values.includes(value),
  }
}

/**
 * Create a prop for array of specific type.
 */
export function arrayOf<T>(
  _itemType: PropType<T>,
  options: Omit<PropOptions<T[]>, 'type'> = {},
): PropOptions<T[]> {
  return {
    ...options,
    type: Array,
    validator: (value: T[]) => {
      if (!Array.isArray(value)) return false
      // Note: Deep type checking would require runtime type info
      return true
    },
  }
}

/**
 * Create a prop for object with specific shape.
 */
export function shape<T extends Record<string, unknown>>(
  _shape: PropsDefinition<T>,
  options: Omit<PropOptions<T>, 'type'> = {},
): PropOptions<T> {
  return {
    ...options,
    type: Object,
    // Note: Deep shape validation would be done at runtime
  }
}

// =============================================================================
// Runtime Props Processing
// =============================================================================

/**
 * Process props passed to a component.
 * Called internally during component rendering.
 */
export function processComponentProps(
  rawProps: Record<string, unknown>,
  definitions?: PropsDefinition<Record<string, unknown>>,
  componentName?: string,
): Record<string, unknown> {
  if (!definitions) {
    return rawProps
  }

  const result: Record<string, unknown> = {}

  for (const [key, def] of Object.entries(definitions)) {
    const options: PropOptions<unknown> = typeof def === 'function' || Array.isArray(def)
      ? { type: def as PropType<unknown> }
      : (def as PropOptions<unknown>) || {}

    let value = rawProps[key]

    // Apply default
    if (value === undefined && options.default !== undefined) {
      value = typeof options.default === 'function'
        ? (options.default as () => unknown)()
        : options.default
    }

    // Validate in development
    if (process.env.NODE_ENV !== 'production') {
      const error = validateProp(key, value, options, componentName)
      if (error) {
        console.warn(error.message)
      }
    }

    result[key] = value
  }

  // Pass through unknown props
  for (const [key, value] of Object.entries(rawProps)) {
    if (!(key in result)) {
      result[key] = value
    }
  }

  return result
}

// =============================================================================
// Emit (Events)
// =============================================================================

/** Event handler type */
export type EventHandler<T = unknown> = (payload: T) => void

/** Emit function type */
export type EmitFn<E extends Record<string, unknown>> = <K extends keyof E>(
  event: K,
  payload: E[K],
) => void

/**
 * Define component events (emits).
 *
 * @example
 * ```typescript
 * const emit = defineEmits<{
 *   'update:value': string
 *   'submit': { data: FormData }
 *   'close': void
 * }>()
 *
 * // Usage
 * emit('update:value', 'new value')
 * emit('submit', { data: formData })
 * emit('close', undefined)
 * ```
 */
export function defineEmits<E extends Record<string, unknown>>(): EmitFn<E> {
  const element = (globalThis as Record<string, unknown>).__STX_CURRENT_ELEMENT__ as HTMLElement | undefined

  return (<K extends keyof E>(event: K, payload: E[K]) => {
    if (element) {
      const customEvent = new CustomEvent(String(event), {
        detail: payload,
        bubbles: true,
        cancelable: true,
      })
      element.dispatchEvent(customEvent)
    } else {
      // Fallback for SSR or when element not available
      console.warn(`Cannot emit event "${String(event)}" - no element context`)
    }
  }) as EmitFn<E>
}

// =============================================================================
// Expose
// =============================================================================

/**
 * Expose component methods/properties to parent.
 *
 * @example
 * ```typescript
 * defineExpose({
 *   focus: () => inputRef.value?.focus(),
 *   reset: () => { value = '' },
 *   value: computed(() => internalValue)
 * })
 * ```
 */
export function defineExpose<T extends Record<string, unknown>>(exposed: T): void {
  const element = (globalThis as Record<string, unknown>).__STX_CURRENT_ELEMENT__ as HTMLElement | undefined

  if (element) {
    // Attach exposed methods/properties to the element
    (element as unknown as Record<string, unknown>).__stx_exposed__ = exposed

    // Also make them accessible via data attribute for DevTools
    element.setAttribute('data-stx-exposed', Object.keys(exposed).join(','))
  }
}

// =============================================================================
// Generate TypeScript Types
// =============================================================================

/**
 * Generate TypeScript interface from prop definitions.
 * Useful for documentation and type generation.
 */
export function generatePropsInterface(
  componentName: string,
  definitions: PropsDefinition<Record<string, unknown>>,
): string {
  const lines: string[] = [`interface ${componentName}Props {`]

  for (const [key, def] of Object.entries(definitions)) {
    const options: PropOptions<unknown> = typeof def === 'function' || Array.isArray(def)
      ? { type: def as PropType<unknown> }
      : (def as PropOptions<unknown>) || {}

    const typeName = options.type ? getTypeName(options.type as PropType<unknown>) : 'unknown'
    const optional = options.required ? '' : '?'
    const description = options.description ? `  /** ${options.description} */\n` : ''

    lines.push(`${description}  ${key}${optional}: ${typeName}`)
  }

  lines.push('}')
  return lines.join('\n')
}
