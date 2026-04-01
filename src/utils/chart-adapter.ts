import type { Options as HighchartsOptions, SeriesOptionsType } from 'highcharts'
import type { ChartConfig, ChartSeries } from '@/types'
import { getChartFamily } from '@/constants/chart-families'

// ---------------------------------------------------------------------------
// Legend position helper
// ---------------------------------------------------------------------------
function legendLayout(position: 'top' | 'bottom' | 'left' | 'right') {
  if (position === 'left' || position === 'right') {
    return { layout: 'vertical' as const, align: position as 'left' | 'right', verticalAlign: 'middle' as const }
  }
  return { layout: 'horizontal' as const, align: 'center' as const, verticalAlign: position as 'top' | 'bottom' }
}

// ---------------------------------------------------------------------------
// Common options shared by most chart types
// ---------------------------------------------------------------------------
function commonOptions(config: ChartConfig): Partial<HighchartsOptions> {
  const legendPos = config.legend?.position ?? 'bottom'
  return {
    title:    { text: config.title    ?? '' },
    subtitle: { text: config.subtitle ?? '' },
    colors:   config.colors,
    legend: {
      enabled: config.legend?.enabled ?? true,
      ...legendLayout(legendPos),
    },
    tooltip: config.tooltip
      ? {
          enabled: config.tooltip.enabled,
          valueSuffix: config.tooltip.valueSuffix,
          valuePrefix: config.tooltip.valuePrefix,
        }
      : { enabled: true },
    chart: { height: config.height ?? 300 },
  }
}

// ---------------------------------------------------------------------------
// STANDARD family: line, spline, area, bar, column, waterfall
// ---------------------------------------------------------------------------
function buildStandard(config: ChartConfig, categories: string[], series: ChartSeries[]): HighchartsOptions {
  const hcType = config.chartType
  const waterfall = config.waterfall

  return {
    ...commonOptions(config),
    chart: { type: hcType, height: config.height ?? 300 },
    xAxis: {
      categories: categories.length ? categories : undefined,
      title: { text: config.xAxis?.title ?? '' },
    },
    yAxis: {
      title: { text: config.yAxis?.title ?? '' },
      min: config.yAxis?.min,
      max: config.yAxis?.max,
    },
    plotOptions: {
      series: {
        dataLabels: { enabled: config.showDataLabels },
        stacking: config.stacking ?? undefined,
      },
      waterfall: waterfall
        ? { upColor: waterfall.upColor ?? '#4CAF50', color: waterfall.color ?? '#F44336' }
        : undefined,
    },
    series: series.map((s) => ({
      name: s.name,
      data: s.data,
      type: hcType,
      color: s.color,
    })) as SeriesOptionsType[],
  }
}

// ---------------------------------------------------------------------------
// PIE family: pie, donut, funnel, pyramid
// ---------------------------------------------------------------------------
function buildPie(config: ChartConfig, series: ChartSeries[]): HighchartsOptions {
  const chartType = config.chartType
  // donut → 'pie' with innerSize, funnel/pyramid → their own hc types
  let hcType: string = chartType
  if (chartType === 'donut') hcType = 'pie'

  const pieOpts = config.pie ?? {}
  const innerSize = chartType === 'donut'
    ? (pieOpts.innerSize ?? '50%')
    : (chartType === 'pie' ? (pieOpts.innerSize ?? '0%') : undefined)

  return {
    ...commonOptions(config),
    chart: { type: hcType, height: config.height ?? 300 },
    plotOptions: {
      pie: {
        innerSize,
        startAngle: pieOpts.startAngle,
        allowPointSelect: pieOpts.allowPointSelect ?? false,
        dataLabels: { enabled: config.showDataLabels },
      },
      funnel: {
        dataLabels: { enabled: config.showDataLabels },
      },
      pyramid: {
        dataLabels: { enabled: config.showDataLabels },
      },
    },
    series: series.map((s) => ({
      name: s.name,
      data: s.data,
      type: hcType,
      color: s.color,
    })) as SeriesOptionsType[],
  }
}

// ---------------------------------------------------------------------------
// SCATTER family
// ---------------------------------------------------------------------------
function buildScatter(config: ChartConfig, series: ChartSeries[]): HighchartsOptions {
  return {
    ...commonOptions(config),
    chart: { type: 'scatter', height: config.height ?? 300 },
    xAxis: {
      title: { text: config.xAxis?.title ?? '' },
      gridLineWidth: 1,
    },
    yAxis: {
      title: { text: config.yAxis?.title ?? '' },
      min: config.yAxis?.min,
      max: config.yAxis?.max,
    },
    plotOptions: {
      scatter: {
        dataLabels: { enabled: config.showDataLabels },
      },
    },
    series: series.map((s) => ({
      name: s.name,
      data: s.data,
      type: 'scatter',
      color: s.color,
    })) as SeriesOptionsType[],
  }
}

// ---------------------------------------------------------------------------
// BUBBLE family
// ---------------------------------------------------------------------------
function buildBubble(config: ChartConfig, series: ChartSeries[]): HighchartsOptions {
  const bubbleOpts = config.bubble ?? {}
  return {
    ...commonOptions(config),
    chart: { type: 'bubble', height: config.height ?? 300 },
    xAxis: {
      title: { text: config.xAxis?.title ?? '' },
      gridLineWidth: 1,
    },
    yAxis: {
      title: { text: config.yAxis?.title ?? '' },
      min: config.yAxis?.min,
      max: config.yAxis?.max,
    },
    plotOptions: {
      bubble: {
        minSize: bubbleOpts.minSize ?? 8,
        maxSize: bubbleOpts.maxSize ?? 60,
        displayNegative: bubbleOpts.displayNegative ?? false,
        dataLabels: { enabled: config.showDataLabels },
      },
    },
    series: series.map((s) => ({
      name: s.name,
      data: s.data,
      type: 'bubble',
      color: s.color,
    })) as SeriesOptionsType[],
  }
}

// ---------------------------------------------------------------------------
// HEATMAP family
// ---------------------------------------------------------------------------
function buildHeatmap(config: ChartConfig, xCategories: string[], series: ChartSeries[]): HighchartsOptions {
  const colorAxis = config.colorAxis ?? {}
  // yCategories are attached to the first series by response-mapper
  const yCategories = (series[0] as ChartSeries & { yCategories?: string[] })?.yCategories ?? []

  return {
    ...commonOptions(config),
    chart: { type: 'heatmap', height: config.height ?? 300 },
    xAxis: {
      categories: xCategories.length ? xCategories : undefined,
      title: { text: config.xAxis?.title ?? '' },
    },
    yAxis: {
      categories: yCategories.length ? yCategories : undefined,
      title: { text: config.yAxis?.title ?? '' },
      reversed: true,
    },
    colorAxis: {
      min: colorAxis.min,
      max: colorAxis.max,
      minColor: colorAxis.minColor ?? '#FFFFFF',
      maxColor: colorAxis.maxColor ?? '#003399',
    },
    plotOptions: {
      heatmap: {
        dataLabels: { enabled: config.showDataLabels },
      },
    },
    series: series.map((s) => ({
      name: s.name,
      data: s.data,
      type: 'heatmap',
    })) as SeriesOptionsType[],
  }
}

// ---------------------------------------------------------------------------
// GAUGE family: gauge, solidgauge
// ---------------------------------------------------------------------------
function buildGauge(config: ChartConfig, series: ChartSeries[]): HighchartsOptions {
  const gaugeOpts = config.gauge ?? { min: 0, max: 100 }
  const hcType = config.chartType // 'gauge' | 'solidgauge'
  const value = (series[0]?.data[0] as number) ?? 0

  const plotBands = gaugeOpts.plotBands?.map((band) => ({
    from: band.from,
    to: band.to,
    color: band.color,
    label: band.label ? { text: band.label } : undefined,
  }))

  return {
    ...commonOptions(config),
    chart: {
      type: hcType,
      height: config.height ?? 300,
    },
    pane: {
      startAngle: gaugeOpts.startAngle ?? -150,
      endAngle:   gaugeOpts.endAngle   ??  150,
      background: hcType === 'solidgauge'
        ? [{
            backgroundColor: '#EEF',
            innerRadius: '60%',
            outerRadius: '100%',
            shape: 'arc',
          }]
        : undefined,
    },
    yAxis: {
      min: gaugeOpts.min,
      max: gaugeOpts.max,
      plotBands: plotBands,
      title: { text: config.title ?? '' },
      labels: { distance: 20 },
    },
    plotOptions: {
      gauge: {
        dataLabels: {
          enabled: true,
          format: `{y}${config.tooltip?.valueSuffix ?? ''}`,
        },
        dial: { radius: '80%', backgroundColor: '#666', baseWidth: 10 },
        pivot: { backgroundColor: '#666' },
      },
      solidgauge: {
        dataLabels: {
          enabled: true,
          format: `<div style="text-align:center"><span style="font-size:25px">{y}</span><br/></div>`,
          useHTML: true,
        },
        innerRadius: '60%',
        rounded: true,
      },
    },
    series: [{
      name: series[0]?.name ?? 'Value',
      data: [value],
      type: hcType,
    }] as SeriesOptionsType[],
  }
}

// ---------------------------------------------------------------------------
// TREEMAP family
// ---------------------------------------------------------------------------
function buildTreemap(config: ChartConfig, series: ChartSeries[]): HighchartsOptions {
  return {
    ...commonOptions(config),
    chart: { type: 'treemap', height: config.height ?? 300 },
    plotOptions: {
      treemap: {
        layoutAlgorithm: 'squarified',
        dataLabels: { enabled: config.showDataLabels },
      },
    },
    series: series.map((s) => ({
      name: s.name,
      type: 'treemap',
      layoutAlgorithm: 'squarified',
      data: s.data,
    })) as SeriesOptionsType[],
  }
}

// ---------------------------------------------------------------------------
// Main dispatcher
// ---------------------------------------------------------------------------
export function buildHighchartsOptions(
  config: ChartConfig,
  categories: string[],
  series: ChartSeries[],
): HighchartsOptions {
  const family = getChartFamily(config.chartType)

  switch (family) {
    case 'STANDARD': return buildStandard(config, categories, series)
    case 'PIE':      return buildPie(config, series)
    case 'SCATTER':  return buildScatter(config, series)
    case 'BUBBLE':   return buildBubble(config, series)
    case 'HEATMAP':  return buildHeatmap(config, categories, series)
    case 'GAUGE':    return buildGauge(config, series)
    case 'TREEMAP':  return buildTreemap(config, series)
    default:         return buildStandard(config, categories, series)
  }
}
