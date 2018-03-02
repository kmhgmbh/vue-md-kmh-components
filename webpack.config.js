const webpack = require('webpack')
const path = require('path')
const UglifyPlugin = require('uglify-es-webpack-plugin');

module.exports = {
  entry: {
    'vue-md-kmh-components': './index.js',
  },
  output: {
    filename: 'dist/vue-md-kmh-components.min.js',
    libraryTarget: 'umd',
    library: 'vue-md-kmh-components',
    umdNamedDefine: true
  },
  externals: {
    'Vue': 'vue',
    'vue-material': 'vue-material',
    'moment': 'moment'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        use: {
            loader: 'babel-loader',
            options: {
                presets: [
                    'es2015',
                ]
            }
        },
        include: __dirname,
        exclude: /node_modules/
      },
      {
        test: /\.styl$/,
        loader: 'css-loader!stylus-loader?paths=node_modules/bootstrap-stylus/stylus/'
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
            loaders: {
                js: {
                   loader: 'babel-loader',
                   options: {
                       presets: ['es2015']
                   }
                },
            }
        }
      },
      {
        test: /\.css$/,
        loader: 'style!less!css'
      }
    ]
  },
  plugins: [
    new UglifyPlugin( {
      sourceMap : false,
      mangle: true
    })
  ]
};