const tsPreset = require('ts-jest/jest-preset')
// const puppeteerPreset = require('jest-puppeteer/jest-preset')

const config = {
  verbose: true,
  // ...puppeteerPreset,
  ...tsPreset,
  roots: [
    '<rootDir>/src',
  ],
  testMatch: [
    '<rootDir>/**/*.spec.{js,jsx,ts,tsx}',
  ],
  testEnvironment: 'node',
  globals: {
    test_url: `http://${process.env.HOST || '127.0.0.1'}:${process.env.PORT || 3000}`,
  },
}

module.exports = config
