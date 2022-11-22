import * as x25519xsalsa20poly1305 from './algorithems/x25519-xsalsa20-poly1305'
import * as secp256k1 from './algorithems/secp256k1'

const asymmetricEncrypt = async function asymmetricEncryptToHex (publicKey: Uint8Array, data: string): Promise<string> {
  return x25519xsalsa20poly1305.asymmetricEncryptToEncoding(publicKey, data, 'hex')
}

const asymmetricDecrypt = async function asymmetricDecryptFromHex (privateKey: Uint8Array, hex: string): Promise<string> {
  return x25519xsalsa20poly1305.asymmetricDecryptFromEncoding(privateKey, hex, 'hex')
}

/**
 * @deprecated use x25519xsalsa20poly1305.asymmetricEncryptToEncoding()
 */
export const encryptToHex = asymmetricEncrypt

/**
 * @deprecated use x25519xsalsa20poly1305.asymmetricEncryptFromEncoding()
 */
export const decryptFromHex = asymmetricDecrypt

/**
 * @deprecated use x25519xsalsa20poly1305.asymmetricEncryptToEncoding()
 */
export const asymmetricEncryptToHex = asymmetricEncrypt

/**
 * @deprecated use x25519xsalsa20poly1305.asymmetricEncryptFromEncoding()
 */
export const asymmetricDecryptFromHex = asymmetricDecrypt

/**
 * @deprecated use secp256k1.sign()
 */
export const sign = secp256k1.sign
