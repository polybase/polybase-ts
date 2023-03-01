
const win: any = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this

export let crypto: Crypto = win.crypto
if (!crypto) {
  // Node versions <19.0.0 need a special flag to enable the global `crypto` object.
  // We use `eval` so that webpack doesn't try to bundle the `crypto` module.
  // eslint-disable-next-line no-eval
  crypto = eval('require("crypto").webcrypto')
}
