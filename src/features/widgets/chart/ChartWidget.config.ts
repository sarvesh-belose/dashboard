import { z } from 'zod'
import { WidgetRegistry } from '@/registry/WidgetRegistry'
import { ChartWidget } from './ChartWidget'
import { WIZARD_STEPS_FOR_TYPE } from '@/constants/widget.constants'
import { IconChartLine } from '@tabler/icons-react'

const schema = z.object({
  type: z.literal('chart'),
  title: z.string().min(1),
  chartConfig: z.object({
    chartType: z.string(),
    showDataLabels: z.boolean(),
  }),
})

WidgetRegistry.register({
  type: 'chart',
  label: 'Chart',
  icon: IconChartLine,
  component: ChartWidget,
  wizardSteps: WIZARD_STEPS_FOR_TYPE['chart'],
  defaultConfig: () => ({
    type: 'chart',
    roles: [],
    filterBindings: [],
    chartConfig: { chartType: 'line', showDataLabels: false },
  }),
  configValidator: schema,
})
