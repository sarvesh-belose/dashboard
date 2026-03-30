import { z } from 'zod'
import { WidgetRegistry } from '@/registry/WidgetRegistry'
import { CustomWidget } from './CustomWidget'
import { WIZARD_STEPS_FOR_TYPE } from '@/constants/widget.constants'
import { IconPuzzle } from '@tabler/icons-react'

const schema = z.object({
  type: z.literal('custom'),
  title: z.string().min(1),
  componentKey: z.string().min(1),
})

WidgetRegistry.register({
  type: 'custom',
  label: 'Custom Component',
  icon: IconPuzzle,
  component: CustomWidget,
  wizardSteps: WIZARD_STEPS_FOR_TYPE['custom'],
  defaultConfig: () => ({
    type: 'custom',
    roles: [],
    filterBindings: [],
    componentKey: '',
    componentProps: {},
  }),
  configValidator: schema,
})
