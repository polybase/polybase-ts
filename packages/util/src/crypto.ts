
const win: any = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this

export const crypto: Crypto = win.crypto
