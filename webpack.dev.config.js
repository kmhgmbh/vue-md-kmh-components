const webpack = require('webpack')
const path = require('path')
var projectRoot = path.resolve(__dirname, '../');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyPlugin = require('uglify-es-webpack-plugin');

module.exports = {
  entry: {
    app: './src/dev.js',
  },
  devtool: '#source-map',
  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/',
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js','.vue', '.Vue'],
    alias: {
      'src': path.resolve(__dirname, '../src'),
      '@': path.resolve(__dirname, '../src'),
    }
  },
  module: {
    loaders: [
      {
        test: /\.styl$/,
        loader: 'css-loader!stylus-loader?paths=node_modules/bootstrap-stylus/stylus/'
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.css$/,
        loader: 'css-loader'
      },
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
        include: projectRoot,
        exclude: /node_modules/
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
        'process.env': "'development'"
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.html',
      inject: true
    })
  ]
};
