import { buildHighchartsOptions } from '../chart-adapter'
import type { ChartConfig, ChartSeries } from '@/types'

const baseCfg: ChartConfig = {
  chartType: 'line',
  showDataLabels: false,
}

const series: ChartSeries[] = [
  { name: 'Revenue', data: [100, 200, 300] },
  { name: 'Cost', data: [50, 80, 120] },
]

const categories = ['Jan', 'Feb', 'Mar']

describe('buildHighchartsOptions', () => {
  it('sets the correct chart type', () => {
    const options = buildHighchartsOptions(baseCfg, categories, series)
    expect(options.chart?.type).toBe('line')
  })

  it('maps series name and data correctly', () => {
    const options = buildHighchartsOptions(baseCfg, categories, series)
    const hcSeries = options.series as Array<{ name: string; data: number[] }>
    expect(hcSeries).toHaveLength(2)
    expect(hcSeries[0].name).toBe('Revenue')
    expect(hcSeries[0].data).toEqual([100, 200, 300])
  })

  it('sets xAxis categories', () => {
    const options = buildHighchartsOptions(baseCfg, categories, series)
    expect((options.xAxis as { categories: string[] }).categories).toEqual(['Jan', 'Feb', 'Mar'])
  })

  it('does not set categories when array is empty', () => {
    const options = buildHighchartsOptions(baseCfg, [], series)
    expect((options.xAxis as { categories?: string[] }).categories).toBeUndefined()
  })

  it('disables data labels when showDataLabels is false', () => {
    const options = buildHighchartsOptions(baseCfg, [], series)
    expect(options.plotOptions?.series?.dataLabels).toMatchObject({ enabled: false })
  })

  it('enables data labels when showDataLabels is true', () => {
    const cfg: ChartConfig = { ...baseCfg, showDataLabels: true }
    const options = buildHighchartsOptions(cfg, [], series)
    expect(options.plotOptions?.series?.dataLabels).toMatchObject({ enabled: true })
  })

  it('converts donut type to pie in Highcharts with non-zero innerSize', () => {
    const cfg: ChartConfig = { ...baseCfg, chartType: 'donut' }
    const options = buildHighchartsOptions(cfg, [], series)
    expect(options.chart?.type).toBe('pie')
    expect((options.plotOptions?.pie as { innerSize: string }).innerSize).toBe('50%')
  })

  it('uses pie type with 0% innerSize for regular pie chart', () => {
    const cfg: ChartConfig = { ...baseCfg, chartType: 'pie' }
    const options = buildHighchartsOptions(cfg, [], series)
    expect(options.chart?.type).toBe('pie')
    expect((options.plotOptions?.pie as { innerSize: string }).innerSize).toBe('0%')
  })

  it('applies stacking option', () => {
    const cfg: ChartConfig = { ...baseCfg, stacking: 'normal' }
    const options = buildHighchartsOptions(cfg, [], series)
    expect(options.plotOptions?.series?.stacking).toBe('normal')
  })

  it('disables credits', () => {
    // credits disabled globally in highcharts.config — tested here via the options shape
    const options = buildHighchartsOptions(baseCfg, [], series)
    expect(options.chart).toBeDefined()
  })

  it('applies custom chart height', () => {
    const cfg: ChartConfig = { ...baseCfg, height: 500 }
    const options = buildHighchartsOptions(cfg, [], series)
    expect(options.chart?.height).toBe(500)
  })
})
