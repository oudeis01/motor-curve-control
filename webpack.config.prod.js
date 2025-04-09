// webpack.config.prod.js
module.exports = {
    mode: 'production',
    externals: {
      'electron': 'require("electron")',
      'original-fs': 'require("original-fs")'
    },
    optimization: {
      concatenateModules: true,
      usedExports: true,
      sideEffects: true,
      splitChunks: {
        chunks: 'all',
        minSize: 30000,
        maxSize: 500000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10
          }
        }
      }
    }
  };