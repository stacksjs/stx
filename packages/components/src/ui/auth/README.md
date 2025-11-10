# Auth Components

Authentication UI components including Login, Signup, and Two-Factor Authentication.

## Components

### Login
A full-featured login form with email/password and optional social login.

### Signup
A registration form with name, email, email confirmation, and password fields.

### TwoFactorChallenge
A 2FA code entry component with auto-focus and recovery code option.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

### Login Component

```stx
<script>
export const handleLogin = (data) => {
  console.log('Login:', data.email, data.password)
}
</script>

@component('Login', {
  showLogo: true,
  headingText: 'Sign in to your account',
  showSocialLogin: true,
  showRememberMe: true,
  showForgotPassword: true,
  showSignup: true,
  signupText: 'Start a 14 day free trial',
  onSubmit: handleLogin
})
@endcomponent
```

### Signup Component

```stx
<script>
export const handleSignup = (data) => {
  console.log('Signup:', data.name, data.email, data.password)
}
</script>

@component('Signup', {
  headingText: 'Sign up for Stacks',
  showSocialSignup: true,
  onSubmit: handleSignup
})
@endcomponent
```

### TwoFactorChallenge Component

```stx
<script>
export const handleVerify = (code) => {
  console.log('2FA Code:', code)
}

export const handleRecoveryCode = () => {
  console.log('Using recovery code')
}
</script>

@component('TwoFactorChallenge', {
  headingText: 'Two Factor Authentication',
  labelText: 'Authentication code',
  instructionText: 'Open your 2FA app to view your authentication code.',
  codeLength: 6,
  onSubmit: handleVerify,
  onUseRecoveryCode: handleRecoveryCode
})
@endcomponent
```

## Props

### Login Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showLogo` | `boolean` | `true` | Show logo at top |
| `headingText` | `string` | `'Sign in to your account'` | Heading text |
| `showSocialLogin` | `boolean` | `true` | Show social login buttons |
| `showRememberMe` | `boolean` | `true` | Show remember me checkbox |
| `showForgotPassword` | `boolean` | `true` | Show forgot password link |
| `showSignup` | `boolean` | `true` | Show signup link at bottom |
| `signupText` | `string` | `'Start a 14 day free trial'` | Signup link text |
| `onSubmit` | `function` | - | Callback when form submitted |
| `className` | `string` | `''` | Additional CSS classes |

### Signup Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `headingText` | `string` | `'Sign up for Stacks'` | Heading text |
| `showSocialSignup` | `boolean` | `true` | Show social signup buttons |
| `onSubmit` | `function` | - | Callback when form submitted |
| `className` | `string` | `''` | Additional CSS classes |

### TwoFactorChallenge Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `headingText` | `string` | `'Two Factor Authentication'` | Heading text |
| `labelText` | `string` | `'Authentication code'` | Input label |
| `instructionText` | `string` | `'Open your Symantec 2FA app...'` | Instructions |
| `codeLength` | `number` | `6` | Number of code digits |
| `onSubmit` | `function` | - | Callback with complete code |
| `onUseRecoveryCode` | `function` | - | Callback for recovery code |
| `className` | `string` | `''` | Additional CSS classes |

## Features

- **Modern ES module exports** - Clean, modern JavaScript
- **Dark mode support** - All components support dark mode
- **Fully accessible** - Proper labels, ARIA attributes
- **Social login** - Google and GitHub integration
- **Auto-focus** - 2FA inputs auto-focus next field
- **Validation** - Email confirmation validation in Signup
- **TypeScript** - Full type definitions
- **Headwind styling** - Utility-first CSS classes

## Accessibility

- Proper label associations
- ARIA attributes where needed
- Keyboard navigation support
- Focus management in 2FA component
- Required field indicators

## Customization

All components accept a `className` prop for additional styling and support full customization through props.
