import { Stack, TextInput, Textarea } from '@mantine/core'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { useWizardValidation } from '../WizardValidationContext'

export function Step2_BasicInfo() {
  const { draft, updateDraft } = useWidgetWizardStore()
  const { showErrors } = useWizardValidation()

  const title = draft.title ?? ''
  const description = draft.description ?? ''
  const titleError = showErrors && !title.trim() ? 'Widget title is required.' : undefined

  return (
    <Stack gap="md">
      <TextInput
        label="Widget Title"
        placeholder="e.g. Monthly Revenue"
        required
        value={title}
        error={titleError}
        onChange={(e) => updateDraft({ title: e.currentTarget.value })}
      />
      <Textarea
        label="Description"
        placeholder="Optional description"
        rows={3}
        value={description}
        onChange={(e) => updateDraft({ description: e.currentTarget.value })}
      />
    </Stack>
  )
}
