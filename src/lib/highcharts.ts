/**
 * Initialize all required Highcharts modules.
 * Highcharts 12+ modules self-register on import — no function call needed.
 * Import this file once at app entry (main.tsx) before any chart is rendered.
 */
import 'highcharts/highcharts-more'
import 'highcharts/modules/heatmap'
import 'highcharts/modules/funnel'
import 'highcharts/modules/solid-gauge'
import 'highcharts/modules/treemap'

export { default } from 'highcharts'
