import Highcharts from 'highcharts'
import 'highcharts/highcharts-more'
import 'highcharts/modules/exporting'
import 'highcharts/modules/accessibility'
import 'highcharts/modules/heatmap'
import 'highcharts/modules/funnel'
import 'highcharts/modules/solid-gauge'
import 'highcharts/modules/treemap'

Highcharts.setOptions({
  chart: {
    style: {
      fontFamily: 'inherit',
    },
  },
  credits: {
    enabled: false,
  },
  colors: [
    '#228be6',
    '#40c057',
    '#fd7e14',
    '#ae3ec9',
    '#f03e3e',
    '#15aabf',
    '#e64980',
    '#74b816',
  ],
})
