import { asymmetricEncryptToHex, asymmetricDecryptFromHex } from './algorithems/x25519-xsalsa20-poly1305'
export { asymmetricEncrypt, asymmetricDecrypt } from './algorithems/x25519-xsalsa20-poly1305'

/**
 * @deprecated use asymmetricEncryptToHex()
 */
export const encryptToHex = asymmetricEncryptToHex

/**
  * @deprecated use asymmetricDecryptFromHex()
  */
export const decryptFromHex = asymmetricDecryptFromHex
