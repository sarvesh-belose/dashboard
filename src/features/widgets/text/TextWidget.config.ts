import { z } from 'zod'
import { WidgetRegistry } from '@/registry/WidgetRegistry'
import { TextWidget } from './TextWidget'
import { WIZARD_STEPS_FOR_TYPE } from '@/constants/widget.constants'
import { IconFileText } from '@tabler/icons-react'

const schema = z.object({
  type: z.literal('text'),
  title: z.string().min(1),
  textConfig: z.object({ content: z.string() }),
})

WidgetRegistry.register({
  type: 'text',
  label: 'Text / Markdown',
  icon: IconFileText,
  component: TextWidget,
  wizardSteps: WIZARD_STEPS_FOR_TYPE['text'],
  defaultConfig: () => ({
    type: 'text',
    roles: [],
    filterBindings: [],
    textConfig: { content: '' },
  }),
  configValidator: schema,
})
