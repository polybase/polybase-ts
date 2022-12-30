const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
  mode: 'production', // build for production (minifies the output)
  entry: './src/index.ts', // entry point for your library
  output: {
    path: path.resolve(__dirname, 'dist'), // output directory
    filename: 'bundle.min.js', // output file name (minified)
    library: 'polybase', // name of the global variable that will contain your library
    libraryTarget: 'umd', // format of the bundle (UMD supports both CommonJS and AMD module systems)
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'], // resolve TypeScript and JavaScript files
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/, // apply to TypeScript files
        use: 'ts-loader', // use the ts-loader to transpile the TypeScript code
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: {
            comments: false, // remove comments from the output
          },
        },
      }),
    ],
  },
}
