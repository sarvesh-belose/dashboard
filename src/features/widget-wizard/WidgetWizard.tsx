import { useState, type ComponentType } from 'react'
import { Modal, Button, Group, Divider, Box, ScrollArea, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { useDashboardStore } from '@/store/dashboard.store'
import { WizardProgressBar } from './WizardProgressBar'
import { WizardValidationContext } from './WizardValidationContext'
import { Step1_SelectType } from './steps/Step1_SelectType'
import { Step2_BasicInfo } from './steps/Step2_BasicInfo'
import { Step3_ApiConfig } from './steps/Step3_ApiConfig'
import { Step4_ApiPreview } from './steps/Step4_ApiPreview'
import { Step5_ResponseMapping } from './steps/Step5_ResponseMapping'
import { Step6_WidgetConfig } from './steps/Step6_WidgetConfig'
import { Step7_RbacConfig } from './steps/Step7_RbacConfig'
import { Step8_FilterBindings } from './steps/Step8_FilterBindings'
import { Step9_Preview } from './steps/Step9_Preview'
import { WizardStep, WIZARD_STEPS_FOR_TYPE, WIDGET_DEFAULT_SIZES } from '@/constants/widget.constants'
import { validateSeriesPath } from '@/utils/response-path-extractor'
import type { Widget, WidgetType, ChartResponseMapping, GridResponseMapping, ApiConfig, ChartWidget } from '@/types'

const STEP_COMPONENTS: Record<WizardStep, ComponentType> = {
  [WizardStep.SelectType]: Step1_SelectType,
  [WizardStep.BasicInfo]: Step2_BasicInfo,
  [WizardStep.ApiConfig]: Step3_ApiConfig,
  [WizardStep.ApiPreview]: Step4_ApiPreview,
  [WizardStep.ResponseMapping]: Step5_ResponseMapping,
  [WizardStep.WidgetConfig]: Step6_WidgetConfig,
  [WizardStep.RbacConfig]: Step7_RbacConfig,
  [WizardStep.FilterBindings]: Step8_FilterBindings,
  [WizardStep.Preview]: Step9_Preview,
}

// ---------------------------------------------------------------------------
// Per-step validation rules — returns error message or null
// ---------------------------------------------------------------------------
function getStepError(step: WizardStep, draft: Partial<Widget>): string | null {
  switch (step) {
    case WizardStep.BasicInfo:
      if (!draft.title?.trim()) return 'Widget title is required.'
      return null

    case WizardStep.ApiConfig: {
      const url = (draft as { apiConfig?: ApiConfig }).apiConfig?.url?.trim()
      if (!url) return 'Endpoint URL is required.'
      try { new URL(url) } catch { return 'Endpoint URL must be a valid URL (e.g. https://api.example.com/data).' }
      return null
    }

    case WizardStep.ResponseMapping: {
      const mapping = (draft as { responseMapping?: ChartResponseMapping | GridResponseMapping }).responseMapping
      if (draft.type === 'chart') {
        if (!(mapping as ChartResponseMapping)?.seriesPath?.trim())
          return 'Series Path is required. Run the API test and use Auto-detect, or enter the path manually.'
      }
      if (draft.type === 'grid') {
        if (!(mapping as GridResponseMapping)?.rowsPath?.trim())
          return 'Rows Path is required. Run the API test and use Auto-detect, or enter the path manually.'
      }
      return null
    }

    default:
      return null
  }
}

export function WidgetWizard() {
  const {
    isOpen, currentStep, draft, editingWidgetId,
    closeWizard, nextStep, prevStep,
    apiPreviewResponse,
  } = useWidgetWizardStore()

  const { addWidget, updateWidget, dashboard } = useDashboardStore()
  const [showErrors, setShowErrors] = useState(false)

  const StepComponent = STEP_COMPONENTS[currentStep]
  const type = draft.type as WidgetType | undefined
  const steps = type ? WIZARD_STEPS_FOR_TYPE[type] : [WizardStep.SelectType]
  const currentIdx = steps.indexOf(currentStep)
  const isLastStep = currentIdx === steps.length - 1
  const isFirstStep = currentIdx === 0

  const stepError = getStepError(currentStep, draft as Partial<Widget>)

  const handleNext = () => {
    if (currentStep === WizardStep.SelectType && !draft.type) {
      setShowErrors(true)
      return
    }
    if (stepError) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    nextStep()
  }

  const handleSave = () => {
    if (!draft.type || !draft.title) {
      setShowErrors(true)
      return
    }

    // Chart type vs data structure mismatch check
    if (draft.type === 'chart' && apiPreviewResponse) {
      const chartDraft = draft as Partial<ChartWidget>
      const seriesPath = chartDraft.responseMapping?.seriesPath
      const chartType = chartDraft.chartConfig?.chartType
      if (seriesPath && chartType) {
        const result = validateSeriesPath(apiPreviewResponse, seriesPath, chartType)
        if (!result.ok) {
          notifications.show({
            title: 'Chart type / data mismatch',
            message: result.message,
            color: 'red',
            autoClose: 8000,
          })
          return
        }
      }
    }

    const now = new Date().toISOString()
    const id = editingWidgetId ?? crypto.randomUUID()
    const widget: Widget = {
      ...draft, id,
      type: draft.type, title: draft.title,
      roles: draft.roles ?? [],
      filterBindings: draft.filterBindings ?? [],
      createdAt: now, updatedAt: now,
    } as Widget

    if (editingWidgetId) {
      updateWidget(editingWidgetId, widget)
    } else {
      const size = WIDGET_DEFAULT_SIZES[type!]
      const maxY = (dashboard?.layout.lg ?? []).reduce((m, i) => Math.max(m, i.y + i.h), 0)
      addWidget(widget, { i: id, x: 0, y: maxY, w: size.w, h: size.h })
    }

    notifications.show({
      title: editingWidgetId ? 'Widget updated' : 'Widget added',
      message: `"${widget.title}" has been ${editingWidgetId ? 'updated' : 'added'} to your dashboard.`,
      color: 'green',
    })
    closeWizard()
  }

  return (
    <Modal
      opened={isOpen}
      onClose={closeWizard}
      size="xl"
      title={editingWidgetId ? 'Edit Widget' : 'Add Widget'}
      centered
      styles={{ body: { padding: 0 } }}
    >
      <WizardValidationContext.Provider value={{ showErrors }}>
        <Box p="md" pt="xs">
          {type && <WizardProgressBar />}

          <ScrollArea style={{ maxHeight: 'calc(80vh - 180px)' }} p="xs">
            {StepComponent && <StepComponent />}
          </ScrollArea>

          {/* Step-level error shown above the nav buttons */}
          {showErrors && stepError && (
            <Text c="red" size="sm" mt="xs" px="xs">
              {stepError}
            </Text>
          )}

          <Divider my="sm" />

          <Group justify="space-between">
            <Button variant="subtle" onClick={isFirstStep ? closeWizard : prevStep} size="sm">
              {isFirstStep ? 'Cancel' : 'Back'}
            </Button>

            {!isLastStep ? (
              <Button onClick={handleNext} size="sm">
                Next
              </Button>
            ) : (
              <Button onClick={handleSave} color="green" size="sm">
                {editingWidgetId ? 'Update Widget' : 'Add to Dashboard'}
              </Button>
            )}
          </Group>
        </Box>
      </WizardValidationContext.Provider>
    </Modal>
  )
}
