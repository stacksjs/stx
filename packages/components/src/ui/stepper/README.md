# Stepper Component

A step-by-step progress indicator for multi-step processes.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script server>
let currentStep = 0

function handleStepClick(step) {
  currentStep = step
}
</script>

<Stepper :currentStep="currentStep">
  <StepperStep :stepNumber="0" :currentStep="currentStep" label="Account" :onClick="handleStepClick" />
  <StepperStep :stepNumber="1" :currentStep="currentStep" label="Profile" :onClick="handleStepClick" />
  <StepperStep :stepNumber="2" :currentStep="currentStep" label="Confirmation" :onClick="handleStepClick" />
</Stepper>
```

## Features

- Horizontal and vertical orientation
- Clickable steps
- Complete/current/upcoming states
- Dark mode support
- Accessible
- Customizable styling
