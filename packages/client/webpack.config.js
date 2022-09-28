const path = require('path')
const nodeExternals = require('webpack-node-externals')

const config = (target) => ({
  target,
  entry: './src/index.ts',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  externals: [
    nodeExternals(),
    {
      '@spacetimexyz/lang': '@spacetimexyz/lang/' + target,
    },
  ],
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          compilerOptions: {
            outDir: path.resolve(__dirname, target),
          },
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, target),
    filename: 'index.js',
    libraryTarget: 'commonjs2',
  },
})

module.exports = [config('node'), config('web')]
