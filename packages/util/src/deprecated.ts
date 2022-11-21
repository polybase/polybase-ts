import * as x25519xsalsa20poly1305 from './algorithems/x25519-xsalsa20-poly1305'
import * as secp256k1 from './algorithems/secp256k1'

/**
 * @deprecated use x25519xsalsa20poly1305.asymmetricEncryptToHex()
 */
export const encryptToHex = x25519xsalsa20poly1305.asymmetricEncryptToHex

/**
 * @deprecated use x25519xsalsa20poly1305.asymmetricDecryptFromHex()
 */
export const decryptFromHex = x25519xsalsa20poly1305.asymmetricDecryptFromHex

/**
 * @deprecated use x25519xsalsa20poly1305.asymmetricEncryptToHex()
 */
export const asymmetricEncryptToHex = x25519xsalsa20poly1305.asymmetricEncryptToHex

/**
 * @deprecated use x25519xsalsa20poly1305.asymmetricDecryptFromHex()
 */
export const asymmetricDecryptFromHex = x25519xsalsa20poly1305.asymmetricDecryptFromHex

/**
 * @deprecated use secp256k1.sign()
 */
export const sign = secp256k1.sign
