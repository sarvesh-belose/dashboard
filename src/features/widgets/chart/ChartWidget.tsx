import HighchartsReact from 'highcharts-react-official'
import Highcharts from 'highcharts'
import { useWidgetData } from '@/hooks/useWidgetData'
import { buildHighchartsOptions } from '@/utils/chart-adapter'
import { WidgetLoadingState } from '../base/WidgetLoadingState'
import { WidgetEmptyState } from '../base/WidgetEmptyState'
import { Center, Text } from '@mantine/core'
import type { WidgetRenderProps, ChartWidget as ChartWidgetType, ChartSeries } from '@/types'

export function ChartWidget({ widget }: WidgetRenderProps) {
  const chartWidget = widget as ChartWidgetType
  const { data, isLoading, isError, error } = useWidgetData(widget.id)

  if (isLoading) return <WidgetLoadingState />
  if (isError) {
    return (
      <Center h="100%">
        <Text size="sm" c="red">
          {(error as Error)?.message ?? 'Failed to load data'}
        </Text>
      </Center>
    )
  }
  if (!data) return <WidgetEmptyState />

  const result = data as { categories: string[]; series: ChartSeries[] }
  const options = buildHighchartsOptions(
    chartWidget.chartConfig,
    result.categories,
    result.series,
  )

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={options}
      containerProps={{ style: { height: '100%', width: '100%' } }}
    />
  )
}
