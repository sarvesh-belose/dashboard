import type { Options as HighchartsOptions } from 'highcharts'
import type { ChartConfig, ChartSeries } from '@/types'

export function buildHighchartsOptions(
  config: ChartConfig,
  categories: string[],
  series: ChartSeries[],
): HighchartsOptions {
  const hcType = config.chartType === 'donut' ? 'pie' : config.chartType

  return {
    chart: {
      type: hcType,
      height: config.height ?? 300,
    },
    title: { text: config.title ?? '' },
    xAxis: {
      categories: categories.length ? categories : undefined,
      title: { text: config.xAxis?.title ?? '' },
    },
    yAxis: {
      title: { text: config.yAxis?.title ?? '' },
    },
    legend: {
      enabled: config.legend?.enabled ?? true,
    },
    colors: config.colors,
    plotOptions: {
      series: {
        dataLabels: { enabled: config.showDataLabels },
        stacking: config.stacking ?? undefined,
      },
      pie: {
        innerSize: config.chartType === 'donut' ? '50%' : '0%',
      },
    },
    series: series.map((s) => ({
      name: s.name,
      data: s.data,
      type: hcType as HighchartsOptions['chart'] extends { type: infer T } ? T : never,
    })) as HighchartsOptions['series'],
  }
}
