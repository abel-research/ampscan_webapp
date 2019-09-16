var path = require("path");
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');
var vtkRules = require('vtk.js/Utilities/config/dependency.js').webpack.core.rules;

module.exports = {
  context: __dirname,

  entry: './assets/js/index.js', // entry point of our app. assets/js/index.js should require other js modules and dependencies it needs

  output: {
      path: path.resolve('./assets/bundles/'),
      filename: "[name]-[hash].js",
  },

  plugins: [
    new BundleTracker({filename: './webpack-stats.json'}),
  ],

  module: {
    rules: [
        { test: /\.html$/, loader: 'html-loader' },
    ].concat(vtkRules),
  },

  resolve: {
     modules: [
      path.resolve(__dirname, 'node_modules'),
    ],
      extensions: ['.js', '.jsx']
  },
}