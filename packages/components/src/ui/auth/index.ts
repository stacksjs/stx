export { default as BiometricSignIn } from './BiometricSignIn.stx'
export { default as Login } from './Login.stx'
export { default as Signup } from './Signup.stx'
export { default as TwoFactorChallenge } from './TwoFactorChallenge.stx'

export * from './biometric'

export interface BiometricSignInProps {
  /** The key the credential is kept under (default `session`). */
  credentialKey?: string
  /** The line under the system prompt: `Sign in to HQ`. */
  reason?: string
  variant?: string
  fullWidth?: boolean
  onSignin?: (detail: { token: string }) => void
  onFallback?: (detail: { reason: 'cancelled' | 'invalidated' }) => void
  onFailed?: (detail: { code: string, message: string }) => void
  className?: string
}

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
