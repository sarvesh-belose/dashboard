/**
 * Initialize all required Highcharts modules.
 * Webpack aliases route these to the ESM builds which self-register correctly.
 * Import this file once at app entry (main.tsx) before any chart is rendered.
 */
import 'highcharts/highcharts-more'
import 'highcharts/modules/heatmap'
import 'highcharts/modules/funnel'
import 'highcharts/modules/solid-gauge'
import 'highcharts/modules/treemap'

export { default } from 'highcharts'
