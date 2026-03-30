import { act } from '@testing-library/react'
import { useWidgetWizardStore } from '../widget-wizard.store'
import { WizardStep, WIZARD_STEPS_FOR_TYPE } from '@/constants/widget.constants'

beforeEach(() => {
  act(() => useWidgetWizardStore.getState().closeWizard())
})

describe('widget-wizard.store', () => {
  describe('openWizard / closeWizard', () => {
    it('opens the wizard and sets isOpen to true', () => {
      act(() => useWidgetWizardStore.getState().openWizard())
      expect(useWidgetWizardStore.getState().isOpen).toBe(true)
    })

    it('opens with a pre-existing widget ID for editing', () => {
      act(() => useWidgetWizardStore.getState().openWizard('widget-123'))
      expect(useWidgetWizardStore.getState().editingWidgetId).toBe('widget-123')
    })

    it('resets state on close', () => {
      act(() => {
        useWidgetWizardStore.getState().openWizard()
        useWidgetWizardStore.getState().updateDraft({ title: 'My Widget', type: 'chart' })
        useWidgetWizardStore.getState().closeWizard()
      })
      const state = useWidgetWizardStore.getState()
      expect(state.isOpen).toBe(false)
      expect(state.draft).toEqual({})
      expect(state.editingWidgetId).toBeNull()
    })
  })

  describe('updateDraft', () => {
    it('merges partial values into draft', () => {
      act(() => {
        useWidgetWizardStore.getState().openWizard()
        useWidgetWizardStore.getState().updateDraft({ title: 'Hello' })
        useWidgetWizardStore.getState().updateDraft({ type: 'grid' })
      })
      expect(useWidgetWizardStore.getState().draft).toMatchObject({ title: 'Hello', type: 'grid' })
    })
  })

  describe('step navigation (chart type)', () => {
    beforeEach(() => {
      act(() => {
        useWidgetWizardStore.getState().openWizard()
        useWidgetWizardStore.getState().updateDraft({ type: 'chart' })
      })
    })

    it('starts at SelectType step', () => {
      expect(useWidgetWizardStore.getState().currentStep).toBe(WizardStep.SelectType)
    })

    it('advances to next step', () => {
      act(() => useWidgetWizardStore.getState().nextStep())
      expect(useWidgetWizardStore.getState().currentStep).toBe(WizardStep.BasicInfo)
    })

    it('marks current step as completed on next', () => {
      act(() => useWidgetWizardStore.getState().nextStep())
      expect(useWidgetWizardStore.getState().completedSteps.has(WizardStep.SelectType)).toBe(true)
    })

    it('goes back to previous step', () => {
      act(() => {
        useWidgetWizardStore.getState().nextStep() // → BasicInfo
        useWidgetWizardStore.getState().prevStep() // → SelectType
      })
      expect(useWidgetWizardStore.getState().currentStep).toBe(WizardStep.SelectType)
    })

    it('does not go before the first step', () => {
      act(() => useWidgetWizardStore.getState().prevStep())
      expect(useWidgetWizardStore.getState().currentStep).toBe(WizardStep.SelectType)
    })

    it('navigates through all chart steps', () => {
      const chartSteps = WIZARD_STEPS_FOR_TYPE['chart']
      for (let i = 0; i < chartSteps.length - 1; i++) {
        act(() => useWidgetWizardStore.getState().nextStep())
      }
      const finalStep = chartSteps[chartSteps.length - 1]
      expect(useWidgetWizardStore.getState().currentStep).toBe(finalStep)
    })
  })

  describe('step navigation (text type — fewer steps)', () => {
    beforeEach(() => {
      act(() => {
        useWidgetWizardStore.getState().openWizard()
        useWidgetWizardStore.getState().updateDraft({ type: 'text' })
      })
    })

    it('skips API steps and goes directly to WidgetConfig after BasicInfo', () => {
      act(() => useWidgetWizardStore.getState().nextStep()) // SelectType → BasicInfo
      act(() => useWidgetWizardStore.getState().nextStep()) // BasicInfo → WidgetConfig
      expect(useWidgetWizardStore.getState().currentStep).toBe(WizardStep.WidgetConfig)
    })
  })

  describe('goToStep', () => {
    it('jumps directly to a specified step', () => {
      act(() => {
        useWidgetWizardStore.getState().openWizard()
        useWidgetWizardStore.getState().updateDraft({ type: 'chart' })
        useWidgetWizardStore.getState().goToStep(WizardStep.RbacConfig)
      })
      expect(useWidgetWizardStore.getState().currentStep).toBe(WizardStep.RbacConfig)
    })
  })

  describe('API preview', () => {
    it('stores response, status, and latency', () => {
      act(() => {
        useWidgetWizardStore.getState().openWizard()
        useWidgetWizardStore.getState().setApiPreview({ items: [] }, 200, 123)
      })
      const state = useWidgetWizardStore.getState()
      expect(state.apiPreviewResponse).toEqual({ items: [] })
      expect(state.apiPreviewStatus).toBe(200)
      expect(state.apiPreviewLatencyMs).toBe(123)
      expect(state.testError).toBeNull()
    })

    it('stores error message', () => {
      act(() => {
        useWidgetWizardStore.getState().openWizard()
        useWidgetWizardStore.getState().setTestError('Network error')
      })
      expect(useWidgetWizardStore.getState().testError).toBe('Network error')
      expect(useWidgetWizardStore.getState().isTesting).toBe(false)
    })
  })
})
