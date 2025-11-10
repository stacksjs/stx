export { default as Stepper } from './Stepper.stx'
export { default as StepperStep } from './StepperStep.stx'

export interface StepperProps {
  currentStep?: number
  orientation?: 'horizontal' | 'vertical'
  className?: string
  as?: string
}

export interface StepperStepProps {
  stepNumber: number
  currentStep?: number
  label?: string
  description?: string
  className?: string
  as?: string
  onClick?: (step: number) => void
}
