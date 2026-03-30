import { useQuery } from '@tanstack/react-query'
import { useDashboardStore } from '@/store/dashboard.store'
import { useFilterBindings } from './useFilterBindings'
import { executeWidgetRequest } from '@/services/proxy.service'
import { mapChartResponse, mapGridResponse } from '@/utils/response-mapper'
import type { ChartWidget, GridWidget } from '@/types'

export function useWidgetData(widgetId: string) {
  const widget = useDashboardStore((s) => s.widgets[widgetId])
  const resolvedParams = useFilterBindings(widget?.filterBindings ?? [])

  const isApiWidget = widget?.type === 'chart' || widget?.type === 'grid'

  return useQuery({
    queryKey: ['widget-data', widgetId, resolvedParams],
    queryFn: async () => {
      if (!isApiWidget) return null
      const apiWidget = widget as ChartWidget | GridWidget
      const { data } = await executeWidgetRequest({
        apiConfig: apiWidget.apiConfig,
        filterParams: resolvedParams,
      })

      if (widget.type === 'chart') {
        return mapChartResponse(data, (widget as ChartWidget).responseMapping)
      }
      if (widget.type === 'grid') {
        return mapGridResponse(data, (widget as GridWidget).responseMapping)
      }
      return data
    },
    enabled: !!widget && isApiWidget,
    staleTime: 30_000,
    retry: 2,
  })
}
