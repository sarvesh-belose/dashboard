/**
 * Initialize all required Highcharts modules.
 * Import this file once at app entry (main.tsx) before any chart is rendered.
 */
import Highcharts from 'highcharts'
import HighchartsMore from 'highcharts/highcharts-more'
import HeatmapModule from 'highcharts/modules/heatmap'
import FunnelModule from 'highcharts/modules/funnel'
import SolidGaugeModule from 'highcharts/modules/solid-gauge'
import TreemapModule from 'highcharts/modules/treemap'

HighchartsMore(Highcharts)
HeatmapModule(Highcharts)
FunnelModule(Highcharts)
SolidGaugeModule(Highcharts)
TreemapModule(Highcharts)

export default Highcharts
