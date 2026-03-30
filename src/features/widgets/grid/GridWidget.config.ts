import { z } from 'zod'
import { WidgetRegistry } from '@/registry/WidgetRegistry'
import { GridWidget } from './GridWidget'
import { WIZARD_STEPS_FOR_TYPE } from '@/constants/widget.constants'
import { IconTable } from '@tabler/icons-react'

const schema = z.object({
  type: z.literal('grid'),
  title: z.string().min(1),
  gridConfig: z.object({
    columnDefs: z.array(z.any()),
    pagination: z.boolean(),
    pageSize: z.number(),
  }),
})

WidgetRegistry.register({
  type: 'grid',
  label: 'Data Grid',
  icon: IconTable,
  component: GridWidget,
  wizardSteps: WIZARD_STEPS_FOR_TYPE['grid'],
  defaultConfig: () => ({
    type: 'grid',
    roles: [],
    filterBindings: [],
    gridConfig: {
      columnDefs: [],
      pagination: true,
      pageSize: 10,
      serverSidePagination: false,
      rowSelection: 'none',
      enableExport: false,
    },
  }),
  configValidator: schema,
})
