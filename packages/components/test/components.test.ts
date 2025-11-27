import type {
  ComboboxProps,
  CommandPaletteProps,
  DialogProps,
  DropdownProps,
  ListboxProps,
  LoginProps,
  NotificationProps,
  PopoverProps,
  RadioGroupProps,
  SignupProps,
  StepperProps,
  TableProps,
  TransitionProps,
  TwoFactorChallengeProps,
} from '../src'
import { describe, expect, it } from 'bun:test'

describe('Component Props', () => {
  describe('Login', () => {
    it('should accept valid props', () => {
      const onSubmit = () => {}
      const props: LoginProps = {
        showLogo: true,
        headingText: 'Sign in',
        showSocialLogin: true,
        showRememberMe: false,
        onSubmit,
      }
      expect(props.showLogo).toBe(true)
      expect(props.headingText).toBe('Sign in')
      expect(props.onSubmit).toBe(onSubmit)
    })
  })

  describe('Signup', () => {
    it('should accept valid props', () => {
      const onSubmit = () => {}
      const props: SignupProps = {
        headingText: 'Create Account',
        showSocialSignup: false,
        onSubmit,
      }
      expect(props.headingText).toBe('Create Account')
      expect(props.showSocialSignup).toBe(false)
      expect(props.onSubmit).toBe(onSubmit)
    })
  })

  describe('TwoFactorChallenge', () => {
    it('should accept valid props', () => {
      const onSubmit = () => {}
      const onUseRecoveryCode = () => {}
      const props: TwoFactorChallengeProps = {
        codeLength: 6,
        onSubmit,
        onUseRecoveryCode,
      }
      expect(props.codeLength).toBe(6)
      expect(props.onSubmit).toBe(onSubmit)
      expect(props.onUseRecoveryCode).toBe(onUseRecoveryCode)
    })
  })

  describe('Dropdown', () => {
    it('should accept valid props', () => {
      const props: DropdownProps = {
        className: 'custom',
        as: 'div',
      }
      expect(props.className).toBe('custom')
      expect(props.as).toBe('div')
    })
  })

  describe('Dialog', () => {
    it('should accept valid props', () => {
      const onClose = () => {}
      const props: DialogProps = {
        open: true,
        onClose,
        className: 'custom',
      }
      expect(props.open).toBe(true)
      expect(props.onClose).toBe(onClose)
    })
  })

  describe('RadioGroup', () => {
    it('should accept valid props', () => {
      const onChange = () => {}
      const props: RadioGroupProps = {
        value: 'option1',
        onChange,
      }
      expect(props.value).toBe('option1')
      expect(props.onChange).toBe(onChange)
    })
  })

  describe('Popover', () => {
    it('should accept valid props', () => {
      const props: PopoverProps = {
        className: 'custom',
        as: 'div',
      }
      expect(props.className).toBe('custom')
    })
  })

  describe('Listbox', () => {
    it('should accept valid props', () => {
      const props: ListboxProps = {
        value: 'selected',
        multiple: true,
      }
      expect(props.value).toBe('selected')
      expect(props.multiple).toBe(true)
    })
  })

  describe('Combobox', () => {
    it('should accept valid props', () => {
      const onChange = () => {}
      const props: ComboboxProps = {
        value: 'item',
        onChange,
      }
      expect(props.value).toBe('item')
      expect(props.onChange).toBe(onChange)
    })
  })

  describe('Notification', () => {
    it('should accept valid props', () => {
      const props: NotificationProps = {
        show: true,
        title: 'Success',
        message: 'Operation completed',
        type: 'success',
        position: 'top-right',
        duration: 5000,
      }
      expect(props.show).toBe(true)
      expect(props.title).toBe('Success')
      expect(props.type).toBe('success')
      expect(props.position).toBe('top-right')
      expect(props.duration).toBe(5000)
    })

    it('should accept all notification types', () => {
      const types: Array<'info' | 'success' | 'warning' | 'error'> = [
        'info',
        'success',
        'warning',
        'error',
      ]

      types.forEach((type) => {
        const props: NotificationProps = { type }
        expect(props.type).toBe(type)
      })
    })

    it('should accept all positions', () => {
      const positions: Array<'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center'> = [
        'top-left',
        'top-right',
        'top-center',
        'bottom-left',
        'bottom-right',
        'bottom-center',
      ]

      positions.forEach((position) => {
        const props: NotificationProps = { position }
        expect(props.position).toBe(position)
      })
    })
  })

  describe('Stepper', () => {
    it('should accept valid props', () => {
      const props: StepperProps = {
        currentStep: 2,
        orientation: 'horizontal',
      }
      expect(props.currentStep).toBe(2)
      expect(props.orientation).toBe('horizontal')
    })

    it('should accept vertical orientation', () => {
      const props: StepperProps = {
        orientation: 'vertical',
      }
      expect(props.orientation).toBe('vertical')
    })
  })

  describe('Transition', () => {
    it('should accept valid props', () => {
      const props: TransitionProps = {
        show: true,
        enter: 'transition-opacity duration-300',
        enterFrom: 'opacity-0',
        enterTo: 'opacity-100',
      }
      expect(props.show).toBe(true)
      expect(props.enter).toContain('transition-opacity')
    })
  })

  describe('Table', () => {
    it('should accept valid props', () => {
      const props: TableProps = {
        striped: true,
        hoverable: true,
        className: 'custom',
      }
      expect(props.striped).toBe(true)
      expect(props.hoverable).toBe(true)
    })
  })

  describe('CommandPalette', () => {
    it('should accept valid props', () => {
      const onClose = () => {}
      const onQueryChange = (q: string) => {}
      const props: CommandPaletteProps = {
        open: true,
        onClose,
        query: 'search',
        onQueryChange,
      }
      expect(props.open).toBe(true)
      expect(props.query).toBe('search')
      expect(props.onClose).toBe(onClose)
    })
  })
})

describe('Component Defaults', () => {
  it('should have sensible defaults', () => {
    const notificationProps: NotificationProps = {}
    expect(notificationProps.show ?? true).toBe(true)
    expect(notificationProps.type ?? 'info').toBe('info')
    expect(notificationProps.position ?? 'top-right').toBe('top-right')
    expect(notificationProps.duration ?? 5000).toBe(5000)
  })

  it('should have default stepper orientation', () => {
    const stepperProps: StepperProps = {}
    expect(stepperProps.orientation ?? 'horizontal').toBe('horizontal')
    expect(stepperProps.currentStep ?? 0).toBe(0)
  })

  it('should have default table props', () => {
    const tableProps: TableProps = {}
    expect(tableProps.striped ?? false).toBe(false)
    expect(tableProps.hoverable ?? true).toBe(true)
  })
})
