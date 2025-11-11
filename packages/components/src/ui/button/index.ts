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
export const buttonPropSchema = {
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
export const validateButtonProps = createPropValidator('Button', buttonPropSchema)
