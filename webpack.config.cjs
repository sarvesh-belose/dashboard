const path = require('path')
const fs = require('fs')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin').default || require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')

// ---------------------------------------------------------------------------
// Mock API middleware — serves sample-data/*.json as REST endpoints
// GET /api/sales/monthly      → sample-data/sales-monthly.json
// GET /api/sales/by-region    → sample-data/sales-by-region.json
// GET /api/sales/by-product   → sample-data/sales-by-product.json
// GET /api/sales/weekly       → sample-data/sales-weekly.json
// GET /api/orders             → sample-data/orders.json
// GET /api/employees          → sample-data/employees.json
// GET /api/kpis               → sample-data/kpis.json
// GET /api/pipeline           → sample-data/pipeline.json
// GET /api/support-tickets    → sample-data/support-tickets.json
// ---------------------------------------------------------------------------
const MOCK_ROUTES = {
  '/api/sales/monthly':   'sales-monthly.json',
  '/api/sales/by-region': 'sales-by-region.json',
  '/api/sales/by-product':'sales-by-product.json',
  '/api/sales/weekly':    'sales-weekly.json',
  '/api/orders':          'orders.json',
  '/api/employees':       'employees.json',
  '/api/kpis':            'kpis.json',
  '/api/pipeline':        'pipeline.json',
  '/api/support-tickets':       'support-tickets.json',
  '/api/scatter/performance':   'scatter-performance.json',
  '/api/bubble/market':         'bubble-market.json',
  '/api/heatmap/weekly':        'heatmap-weekly.json',
  '/api/gauge/performance':     'gauge-performance.json',
  '/api/waterfall/revenue':     'waterfall-revenue.json',
  '/api/funnel/deals':          'funnel-deals.json',
  '/api/treemap/products':      'treemap-products.json',
}

function mockApiMiddleware(req, res, next) {
  const file = MOCK_ROUTES[req.path]
  if (!file) return next()
  const filePath = path.resolve(__dirname, 'sample-data', file)
  if (!fs.existsSync(filePath)) return next()
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  // Simulate a small network delay so loading states are visible
  setTimeout(() => res.end(fs.readFileSync(filePath, 'utf8')), 200)
}

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development'

  return {
    entry: './src/main.tsx',

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isDev ? '[name].js' : '[name].[contenthash].js',
      chunkFilename: isDev ? '[name].chunk.js' : '[name].[contenthash].chunk.js',
      publicPath: '/',
      clean: true,
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        // Use Highcharts ESM build so modules self-register without window._Highcharts
        'highcharts$': path.resolve(__dirname, 'node_modules/highcharts/esm/highcharts.js'),
        'highcharts/highcharts-more': path.resolve(__dirname, 'node_modules/highcharts/esm/highcharts-more.js'),
        'highcharts/modules/heatmap': path.resolve(__dirname, 'node_modules/highcharts/esm/modules/heatmap.js'),
        'highcharts/modules/funnel': path.resolve(__dirname, 'node_modules/highcharts/esm/modules/funnel.js'),
        'highcharts/modules/solid-gauge': path.resolve(__dirname, 'node_modules/highcharts/esm/modules/solid-gauge.js'),
        'highcharts/modules/treemap': path.resolve(__dirname, 'node_modules/highcharts/esm/modules/treemap.js'),
      },
    },

    module: {
      rules: [
        {
          test: /\.(ts|tsx|js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: { cacheDirectory: true },
          },
        },
        {
          test: /\.css$/,
          use: [
            isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'assets/[name].[contenthash][ext]',
          },
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './index.html',
        // Remove the Vite module script tag
        inject: 'body',
      }),
      !isDev &&
        new MiniCssExtractPlugin({
          filename: 'assets/[name].[contenthash].css',
        }),
      new CopyPlugin({
        patterns: [
          {
            from: 'public',
            to: '.',
            noErrorOnMissing: true,
          },
        ],
      }),
    ].filter(Boolean),

    devServer: {
      port: 3000,
      historyApiFallback: true,
      hot: true,
      open: false,
      setupMiddlewares(middlewares, devServer) {
        devServer.app.use(mockApiMiddleware)
        return middlewares
      },
    },

    devtool: isDev ? 'eval-source-map' : 'source-map',

    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          mantine: {
            test: /[\\/]node_modules[\\/]@mantine[\\/]/,
            name: 'mantine',
            chunks: 'all',
            priority: 10,
          },
          highcharts: {
            test: /[\\/]node_modules[\\/]highcharts[\\/]/,
            name: 'highcharts',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    },
  }
}
