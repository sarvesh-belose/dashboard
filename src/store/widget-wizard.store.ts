import { create } from 'zustand'
import type { Widget, WidgetType } from '@/types'
import { WizardStep, WIZARD_STEPS_FOR_TYPE } from '@/constants/widget.constants'

interface WizardState {
  isOpen: boolean
  editingWidgetId: string | null
  currentStep: WizardStep
  completedSteps: Set<WizardStep>
  draft: Partial<Widget>
  apiPreviewResponse: unknown | null
  apiPreviewStatus: number | null
  apiPreviewLatencyMs: number | null
  isTesting: boolean
  testError: string | null
}

interface WizardActions {
  openWizard: (widgetId?: string, initialDraft?: Partial<Widget>) => void
  closeWizard: () => void
  goToStep: (step: WizardStep) => void
  nextStep: () => void
  prevStep: () => void
  updateDraft: (partial: Partial<Widget>) => void
  setApiPreview: (response: unknown, status: number, latencyMs: number) => void
  setTesting: (v: boolean) => void
  setTestError: (err: string | null) => void
  markStepComplete: (step: WizardStep) => void
}

type WizardStore = WizardState & WizardActions

const INITIAL: WizardState = {
  isOpen: false,
  editingWidgetId: null,
  currentStep: WizardStep.SelectType,
  completedSteps: new Set(),
  draft: {},
  apiPreviewResponse: null,
  apiPreviewStatus: null,
  apiPreviewLatencyMs: null,
  isTesting: false,
  testError: null,
}

export const useWidgetWizardStore = create<WizardStore>()((set, get) => ({
  ...INITIAL,

  openWizard: (widgetId, initialDraft) =>
    set({
      ...INITIAL,
      isOpen: true,
      editingWidgetId: widgetId ?? null,
      draft: initialDraft ?? {},
      completedSteps: new Set(),
    }),

  closeWizard: () => set(INITIAL),

  goToStep: (step) => set({ currentStep: step }),

  nextStep: () => {
    const { draft, currentStep } = get()
    const type = draft.type as WidgetType | undefined
    if (!type) return
    const steps = WIZARD_STEPS_FOR_TYPE[type]
    const idx = steps.indexOf(currentStep)
    if (idx < steps.length - 1) {
      set((s) => ({
        currentStep: steps[idx + 1],
        completedSteps: new Set([...s.completedSteps, currentStep]),
      }))
    }
  },

  prevStep: () => {
    const { draft, currentStep } = get()
    const type = draft.type as WidgetType | undefined
    if (!type) return
    const steps = WIZARD_STEPS_FOR_TYPE[type]
    const idx = steps.indexOf(currentStep)
    if (idx > 0) set({ currentStep: steps[idx - 1] })
  },

  updateDraft: (partial) =>
    set((s) => ({ draft: { ...s.draft, ...partial } as Partial<Widget> })),

  setApiPreview: (response, status, latencyMs) =>
    set({ apiPreviewResponse: response, apiPreviewStatus: status, apiPreviewLatencyMs: latencyMs, testError: null }),

  setTesting: (v) => set({ isTesting: v }),
  setTestError: (err) => set({ testError: err, isTesting: false }),
  markStepComplete: (step) =>
    set((s) => ({ completedSteps: new Set([...s.completedSteps, step]) })),
}))
