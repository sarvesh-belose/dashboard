import { Stack, TextInput, Textarea } from '@mantine/core'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useWidgetWizardStore } from '@/store/widget-wizard.store'
import { useEffect } from 'react'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function Step2_BasicInfo() {
  const { draft, updateDraft } = useWidgetWizardStore()

  const {
    register,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: draft.title ?? '', description: draft.description ?? '' },
  })

  const [title, description] = watch(['title', 'description'])

  useEffect(() => {
    updateDraft({ title, description })
  }, [title, description, updateDraft])

  return (
    <Stack gap="md">
      <TextInput
        label="Widget Title"
        placeholder="e.g. Monthly Revenue"
        required
        error={errors.title?.message}
        {...register('title')}
      />
      <Textarea
        label="Description"
        placeholder="Optional description"
        rows={3}
        {...register('description')}
      />
    </Stack>
  )
}
