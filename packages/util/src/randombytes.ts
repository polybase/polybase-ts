let randombytesfn = function (x: Uint8Array, y: number): void {
  throw new Error('No PRNG randombytes fn found')
}

export function randomBytes (len: number) {
  const b = new Uint8Array(len)
  randombytesfn(b, len)
  return b
}

(function () {
  // Initialize PRNG if environment provides CSPRNG.
  // If not, methods calling randombytes will throw.
  let crypto: any = typeof self !== 'undefined' ? (self.crypto || self.msCrypto) : null
  if (crypto && crypto.getRandomValues) {
    // Browsers.
    const QUOTA = 65536
    randombytesfn = function (x: Uint8Array, n: number) {
      let i; const v = new Uint8Array(n)
      for (i = 0; i < n; i += QUOTA) {
        crypto?.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)))
      }
      for (i = 0; i < n; i++) x[i] = v[i]
      cleanup(v)
    }
  } else if (typeof require !== 'undefined') {
    // Node.js.
    crypto = require('crypto')
    if (crypto && crypto.randomBytes) {
      randombytesfn = function (x, n) {
        let i; const v = crypto?.randomBytes(n)
        for (i = 0; i < n; i++) x[i] = v[i]
        cleanup(v)
      }
    }
  }
})()

function cleanup (arr: Uint8Array) {
  for (let i = 0; i < arr.length; i++) arr[i] = 0
}
