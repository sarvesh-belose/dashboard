import { createContext, useContext } from 'react'

interface WizardValidationCtx {
  showErrors: boolean
}

export const WizardValidationContext = createContext<WizardValidationCtx>({ showErrors: false })
export const useWizardValidation = () => useContext(WizardValidationContext)
