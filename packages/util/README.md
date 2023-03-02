# @[polybase](https://polybase.xyz)/util

A utility library to help support common [Polybase](https://polybase.xyz) utility functions.

## Browser Tests

We use `puppeteer` to run our tests in the browser.
We also run the same tests in Node.js.

Only the function in the first argument of `testNodeAndBrowser` runs in the browser (and Node).
This function can't depend on any code outside of the function.
It might also fail if given code that depends on features from ES version higher than
the ES version specified in ts-jest's tsconfig, as it will depend on extra Typescript runtime code.
It's best to keep the function as simple as possible.
