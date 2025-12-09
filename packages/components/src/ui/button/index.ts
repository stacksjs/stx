import type { PropSchema, ValidationResult } from '../../utils/prop-validation'
import { ErrorTypes, wrapErrorHandler } from '../../utils/error-handling'
import { createPropValidator, PropTypes } from '../../utils/prop-validation'

export { default as Button } from './Button.stx'

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  fullWidth?: boolean
  leftIcon?: string
  rightIcon?: string
  className?: string
  onClick?: (event: Event) => void
}

/**
 * Button prop validation schema
 */
export const buttonPropSchema: PropSchema = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'danger']),
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  disabled: PropTypes.boolean,
  loading: PropTypes.boolean,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  fullWidth: PropTypes.boolean,
  leftIcon: PropTypes.string,
  rightIcon: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
}

/**
 * Validate Button component props
 * Only runs in development mode
 */
export const validateButtonProps: (props: Record<string, any>) => ValidationResult = createPropValidator('Button', buttonPropSchema)

/**
 * Create a safe onClick handler that catches and reports errors
 *
 * @param handler - Click handler function
 * @returns Wrapped handler with error handling
 *
 * @example
 * ```ts
 * const safeHandler = createSafeClickHandler(() => {
 *   // Your click logic
 * })
 * ```
 */
export function createSafeClickHandler(handler: (event: Event) => void): (event: Event) => void {
  return wrapErrorHandler(handler, 'Button', 'onClick')
}

/**
 * Helper to validate button variant
 */
export function validateVariant(variant?: string): void {
  if (variant && !['primary', 'secondary', 'outline', 'ghost', 'danger'].includes(variant)) {
    throw ErrorTypes.invalidProp(
      'Button',
      'variant',
      variant,
      ['primary', 'secondary', 'outline', 'ghost', 'danger'],
    )
  }
}

/**
 * Helper to validate button size
 */
export function validateSize(size?: string): void {
  if (size && !['xs', 'sm', 'md', 'lg', 'xl'].includes(size)) {
    throw ErrorTypes.invalidProp(
      'Button',
      'size',
      size,
      ['xs', 'sm', 'md', 'lg', 'xl'],
    )
  }
}
