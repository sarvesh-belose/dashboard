import { Stepper } from '@mantine/core'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { WIZARD_STEPS_FOR_TYPE, WIZARD_STEP_LABELS, WizardStep } from '@/constants/widget.constants'
import type { WidgetType } from '@/types'

export function WizardProgressBar() {
  const { draft, currentStep, completedSteps, goToStep } = useWidgetWizardStore()
  const type = draft.type as WidgetType | undefined
  const steps = type ? WIZARD_STEPS_FOR_TYPE[type] : [WizardStep.SelectType]

  const activeIdx = steps.indexOf(currentStep)

  return (
    <Stepper
      active={activeIdx}
      size="xs"
      allowNextStepsSelect={false}
      mb="md"
    >
      {steps.map((step) => (
        <Stepper.Step
          key={step}
          label={WIZARD_STEP_LABELS[step]}
          onClick={() => {
            if (completedSteps.has(step) || step === currentStep) goToStep(step)
          }}
          style={{ cursor: completedSteps.has(step) ? 'pointer' : 'default' }}
        />
      ))}
    </Stepper>
  )
}
