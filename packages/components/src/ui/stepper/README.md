# Stepper Component

A step-by-step progress indicator for multi-step processes.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script>
export let currentStep = 0

export function handleStepClick(step) {
  currentStep = step
}
</script>

@component('Stepper', { currentStep })
  @component('StepperStep', { stepNumber: 0, currentStep, label: 'Account', onClick: handleStepClick })
  @component('StepperStep', { stepNumber: 1, currentStep, label: 'Profile', onClick: handleStepClick })
  @component('StepperStep', { stepNumber: 2, currentStep, label: 'Confirmation', onClick: handleStepClick })
@endcomponent
```

## Features

- Horizontal and vertical orientation
- Clickable steps
- Complete/current/upcoming states
- Dark mode support
- Accessible
- Customizable styling
