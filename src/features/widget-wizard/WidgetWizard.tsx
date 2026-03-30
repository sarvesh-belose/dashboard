import type { ComponentType } from 'react'
import { Modal, Button, Group, Divider, Box, ScrollArea } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { useDashboardStore } from '@/store/dashboard.store'
import { WizardProgressBar } from './WizardProgressBar'
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
import type { Widget, WidgetType } from '@/types'

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

export function WidgetWizard() {
  const {
    isOpen,
    currentStep,
    draft,
    editingWidgetId,
    closeWizard,
    nextStep,
    prevStep,
  } = useWidgetWizardStore()

  const { addWidget, updateWidget, dashboard } = useDashboardStore()

  const StepComponent = STEP_COMPONENTS[currentStep]
  const type = draft.type as WidgetType | undefined
  const steps = type ? WIZARD_STEPS_FOR_TYPE[type] : [WizardStep.SelectType]
  const currentIdx = steps.indexOf(currentStep)
  const isLastStep = currentIdx === steps.length - 1
  const isFirstStep = currentIdx === 0

  const handleSave = () => {
    if (!draft.type || !draft.title) return

    const now = new Date().toISOString()
    const id = editingWidgetId ?? crypto.randomUUID()
    const widget: Widget = {
      ...draft,
      id,
      type: draft.type,
      title: draft.title,
      roles: draft.roles ?? [],
      filterBindings: draft.filterBindings ?? [],
      createdAt: now,
      updatedAt: now,
    } as Widget

    if (editingWidgetId) {
      updateWidget(editingWidgetId, widget)
    } else {
      const size = WIDGET_DEFAULT_SIZES[type!]
      const existingItems = dashboard?.layout.lg ?? []
      const maxY = existingItems.reduce((m, i) => Math.max(m, i.y + i.h), 0)
      addWidget(widget, {
        i: id,
        x: 0,
        y: maxY,
        w: size.w,
        h: size.h,
      })
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
      <Box p="md" pt="xs">
        {type && <WizardProgressBar />}

        <ScrollArea style={{ maxHeight: 'calc(80vh - 160px)' }} p="xs">
          {StepComponent && <StepComponent />}
        </ScrollArea>

        <Divider my="sm" />

        <Group justify="space-between">
          <Button
            variant="subtle"
            onClick={isFirstStep ? closeWizard : prevStep}
            size="sm"
          >
            {isFirstStep ? 'Cancel' : 'Back'}
          </Button>

          {!isLastStep ? (
            <Button
              onClick={nextStep}
              disabled={currentStep === WizardStep.SelectType && !draft.type}
              size="sm"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={!draft.title}
              color="green"
              size="sm"
            >
              {editingWidgetId ? 'Update Widget' : 'Add to Dashboard'}
            </Button>
          )}
        </Group>
      </Box>
    </Modal>
  )
}
