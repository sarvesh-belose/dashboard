import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { Box } from '@mantine/core'
import { useDashboardStore } from '@/store/dashboard.store'
import { useDashboardLayout } from '@/hooks/useDashboardLayout'
import { WidgetShell } from '@/features/widgets/base/WidgetShell'
import { EmptyDashboard } from './EmptyDashboard'

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480 }
const COLS = { lg: 12, md: 10, sm: 6, xs: 4 }

export function DashboardGrid() {
  const { dashboard, isEditMode, onLayoutChange } = useDashboardLayout()
  const widgets = useDashboardStore((s) => s.widgets)
  const { width, containerRef } = useContainerWidth()

  if (!dashboard) return null
  if (dashboard.widgetIds.length === 0) return <EmptyDashboard />

  return (
    <Box p="md" ref={containerRef} style={{ flex: 1, width: '100%' }}>
      <ResponsiveGridLayout
        width={width ?? 1200}
        layouts={dashboard.layout as never}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={80}
        margin={[12, 12]}
        dragConfig={{ enabled: isEditMode, handle: '.drag-handle' }}
        resizeConfig={{ enabled: isEditMode, handles: ['se'] }}
        onLayoutChange={(_layout, allLayouts) =>
          onLayoutChange(undefined, allLayouts as never)
        }
        style={{ minHeight: 100 }}
      >
        {dashboard.widgetIds
          .filter((id) => !!widgets[id])
          .map((widgetId) => (
            <div key={widgetId}>
              <WidgetShell widgetId={widgetId} />
            </div>
          ))}
      </ResponsiveGridLayout>
    </Box>
  )
}
