export { default as Login } from './Login.stx'
export { default as Signup } from './Signup.stx'
export { default as TwoFactorChallenge } from './TwoFactorChallenge.stx'

export interface LoginProps {
  showLogo?: boolean
  headingText?: string
  showSocialLogin?: boolean
  showRememberMe?: boolean
  showForgotPassword?: boolean
  showSignup?: boolean
  signupText?: string
  onSubmit?: (data: { email: string, password: string }) => void
  className?: string
}

export interface SignupProps {
  headingText?: string
  showSocialSignup?: boolean
  onSubmit?: (data: { name: string, email: string, password: string }) => void
  className?: string
}

export interface TwoFactorChallengeProps {
  headingText?: string
  labelText?: string
  instructionText?: string
  codeLength?: number
  onSubmit?: (code: string) => void
  onUseRecoveryCode?: () => void
  className?: string
}
