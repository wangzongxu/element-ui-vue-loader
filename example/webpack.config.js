module.exports = {
  entry: './main.js',
  mode: 'development',
  output: {
    path: path.resolve('./dist'),
    filename: '[name].js'
  },
  resolveLoader:{
    modules: ['mode_modules', 'loaders']
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: { /* vue-loader config */ }
      },
      { // Under the vue-loader
        test: /\.vue$/,
        loader: 'element-ui-vue-loader'
      }
    ]
  }
}
