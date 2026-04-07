import { Box, Divider } from '@mantine/core'
import { FilterBar } from '@/features/filters/FilterBar'
import { DashboardToolbar } from '@/features/dashboard/DashboardToolbar'
import { DashboardGrid } from '@/features/dashboard/DashboardGrid'
import { WidgetWizard } from '@/features/widget-wizard/WidgetWizard'

/** When the page is loaded with ?embed=1 we strip the toolbar and filter bar
 *  so the grid fills the full iframe without any chrome. */
const isEmbedMode = new URLSearchParams(window.location.search).get('embed') === '1'

export function DashboardLayout() {
  if (isEmbedMode) {
    return (
      <Box style={{ width: '100%', height: '100%', overflow: 'auto' }}>
        <DashboardGrid />
      </Box>
    )
  }

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
