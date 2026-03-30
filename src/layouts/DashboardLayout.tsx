import { Box, Divider } from '@mantine/core'
import { FilterBar } from '@/features/filters/FilterBar'
import { DashboardToolbar } from '@/features/dashboard/DashboardToolbar'
import { DashboardGrid } from '@/features/dashboard/DashboardGrid'
import { WidgetWizard } from '@/features/widget-wizard/WidgetWizard'

export function DashboardLayout() {
  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <DashboardToolbar />
      <FilterBar />
      <Divider />
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <DashboardGrid />
      </Box>
      <WidgetWizard />
    </Box>
  )
}
