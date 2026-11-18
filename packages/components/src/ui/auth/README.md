# Auth Components

Authentication UI components including Login, Signup, and Two-Factor Authentication.

## Components

### Login
A full-featured login form with email/password and optional social login.

### Signup
A registration form with name, email, email confirmation, and password fields.

### TwoFactorChallenge
A 2FA code entry component with auto-focus and recovery code option.

### BiometricSignIn
"Sign in with Face ID" (or Touch ID): a button offered only inside Craft, on a device with Face ID or Touch ID set up, once the app has kept a token. It renders nothing in a browser or on Android.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

### Login Component

```stx
<script server>
const handleLogin = (data) => {
  console.log('Login:', data.email, data.password)
}
</script>

<Login
  showLogo
  headingText="Sign in to your account"
  showSocialLogin
  showRememberMe
  showForgotPassword
  showSignup
  signupText="Start a 14 day free trial"
  :onSubmit="handleLogin"
/>
```

### Signup Component

```stx
<script server>
const handleSignup = (data) => {
  console.log('Signup:', data.name, data.email, data.password)
}
</script>

<Signup
  headingText="Sign up for Stacks"
  showSocialSignup
  :onSubmit="handleSignup"
/>
```

### TwoFactorChallenge Component

```stx
<script server>
const handleVerify = (code) => {
  console.log('2FA Code:', code)
}

const handleRecoveryCode = () => {
  console.log('Using recovery code')
}
</script>

<TwoFactorChallenge
  headingText="Two Factor Authentication"
  labelText="Authentication code"
  instructionText="Open your 2FA app to view your authentication code."
  :codeLength="6"
  :onSubmit="handleVerify"
  :onUseRecoveryCode="handleRecoveryCode"
/>
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

### BiometricSignIn Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `credentialKey` | `string` | `'session'` | Key the token is kept under |
| `reason` | `string` | `''` | Line under the system prompt (`Sign in to HQ`) |
| `variant` | `string` | `'secondary'` | Button variant |
| `fullWidth` | `boolean` | `true` | Full-width button |
| `className` | `string` | `''` | Additional CSS classes |

Events: `@signin` (`$event.token`), `@fallback` (`$event.reason` is `'cancelled'` or `'invalidated'`), `@failed` (`$event.code`, `$event.message`).

## Sign in with Face ID

Craft (0.0.511 and later) keeps a credential in the Keychain behind the face or finger enrolled on the device, so the token itself is withheld until the person passes, not just guarded by the app's code. The flow has three moments, all through `createBiometricSignIn` from `@stacksjs/components/biometric` (its own entry: the package root reaches code a page cannot load):

```ts
import { createBiometricSignIn } from '@stacksjs/components/biometric'

const faceId = createBiometricSignIn('session')

// 1. After a password sign-in: offer "Turn on Face ID", then keep the token.
if ((await faceId.probe()).available)
  await faceId.enable(deviceToken)

// 2. On the sign-in screen: <BiometricSignIn> does this for you.
const result = await faceId.signIn('Sign in to HQ')
// { status: 'signed-in', token } | { status: 'cancelled' } | { status: 'invalidated' } | { status: 'failed', code, message }

// 3. On sign-out.
await faceId.forget()
```

```html
<BiometricSignIn reason="Sign in to HQ"
  @signin="session.exchange($event.token)"
  @fallback="showPassword()" />
```

What the app must provide:

- **A device token, never the password.** The server issues a long-lived token for this device at password sign-in, exchanges it for a session, and revokes it on sign-out.
- **`permissions.faceId` in the Craft config** (`NSFaceIDUsageDescription`). iOS ends an app that asks for Face ID without it.
- **A password path.** `invalidated` means another face or finger was enrolled (or the token is gone); the token is forgotten and the button goes away until the next password sign-in.

The simulator has no Secure Enclave: Features → Face ID → Enrolled, then Matching Face or Non-matching Face, exercises the flow, but only a device proves a read without a match is refused.

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
