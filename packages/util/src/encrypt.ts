import * as nacl from 'tweetnacl'
import * as naclUtil from 'tweetnacl-util'
import { isNullish, makeDataSafe, stringifiableToHex } from './util'

export function encryptToHex (publicKey: string, data: unknown) {
  const e = encrypt({ publicKey, data, version: 'x25519-xsalsa20-poly1305' })
  return stringifiableToHex(e)
}

export function decryptFromHex (privateKey: string, hex: string) {
  let h = hex
  if (hex.startsWith('0x')) {
    h = hex.substring(2)
  }
  const e = JSON.parse(Buffer.from(h, 'hex').toString())
  return decrypt({ encryptedData: e, privateKey })
}

export interface EthEncryptedData {
  version: string;
  nonce: string;
  ephemPublicKey: string;
  ciphertext: string;
}

/**
 * Encrypt a message.
 *
 * @param options - The encryption options.
 * @param options.publicKey - The public key of the message recipient.
 * @param options.data - The message data.
 * @param options.version - The type of encryption to use.
 * @returns The encrypted data.
 */
export function encrypt ({
  publicKey,
  data,
  version,
}: {
  publicKey: string;
  data: string;
  version: string;
}): EthEncryptedData {
  if (isNullish(publicKey)) {
    throw new Error('Missing publicKey parameter')
  } else if (isNullish(data)) {
    throw new Error('Missing data parameter')
  } else if (isNullish(version)) {
    throw new Error('Missing version parameter')
  }

  switch (version) {
    case 'x25519-xsalsa20-poly1305': {
      if (typeof data !== 'string') {
        throw new Error('Message data must be given as a string')
      }
      // generate ephemeral keypair
      const ephemeralKeyPair = nacl.box.keyPair()

      // assemble encryption parameters - from string to UInt8
      let pubKeyUInt8Array
      try {
        pubKeyUInt8Array = naclUtil.decodeBase64(publicKey)
      } catch (err) {
        throw new Error('Bad public key')
      }

      const msgParamsUInt8Array = naclUtil.decodeUTF8(data)
      const nonce = nacl.randomBytes(nacl.box.nonceLength)

      // encrypt
      const encryptedMessage = nacl.box(
        msgParamsUInt8Array,
        nonce,
        pubKeyUInt8Array,
        ephemeralKeyPair.secretKey,
      )

      // handle encrypted data
      const output = {
        version: 'x25519-xsalsa20-poly1305',
        nonce: naclUtil.encodeBase64(nonce),
        ephemPublicKey: naclUtil.encodeBase64(ephemeralKeyPair.publicKey),
        ciphertext: naclUtil.encodeBase64(encryptedMessage),
      }
      // return encrypted msg data
      return output
    }

    default:
      throw new Error('Encryption type/version not supported')
  }
}

/**
 * Encrypt a message in a way that obscures the message length.
 *
 * The message is padded to a multiple of 2048 before being encrypted so that the length of the
 * resulting encrypted message can't be used to guess the exact length of the original message.
 *
 * @param options - The encryption options.
 * @param options.publicKey - The public key of the message recipient.
 * @param options.data - The message data.
 * @param options.version - The type of encryption to use.
 * @returns The encrypted data.
 */
export function encryptSafely ({
  publicKey,
  data,
  version,
}: {
  publicKey: string;
  data: string;
  version: string;
}): EthEncryptedData {
  if (isNullish(publicKey)) {
    throw new Error('Missing publicKey parameter')
  } else if (isNullish(data)) {
    throw new Error('Missing data parameter')
  } else if (isNullish(version)) {
    throw new Error('Missing version parameter')
  }

  const paddedData = makeDataSafe(data)
  return encrypt({ publicKey, data: paddedData, version })
}

/**
 * Decrypt a message.
 *
 * @param options - The decryption options.
 * @param options.encryptedData - The encrypted data.
 * @param options.privateKey - The private key to decrypt with.
 * @returns The decrypted message.
 */
export function decrypt ({
  encryptedData,
  privateKey,
}: {
  encryptedData: EthEncryptedData;
  privateKey: string;
}): string {
  if (isNullish(encryptedData)) {
    throw new Error('Missing encryptedData parameter')
  } else if (isNullish(privateKey)) {
    throw new Error('Missing privateKey parameter')
  }

  switch (encryptedData.version) {
    case 'x25519-xsalsa20-poly1305': {
      // string to buffer to UInt8Array
      const recieverPrivateKeyUint8Array = naclDecodeHex(privateKey)
      const recieverEncryptionPrivateKey = nacl.box.keyPair.fromSecretKey(
        recieverPrivateKeyUint8Array,
      ).secretKey

      // assemble decryption parameters
      const nonce = naclUtil.decodeBase64(encryptedData.nonce)
      const ciphertext = naclUtil.decodeBase64(encryptedData.ciphertext)
      const ephemPublicKey = naclUtil.decodeBase64(
        encryptedData.ephemPublicKey,
      )

      // decrypt
      const decryptedMessage = nacl.box.open(
        ciphertext,
        nonce,
        ephemPublicKey,
        recieverEncryptionPrivateKey,
      )

      // return decrypted msg data
      let output
      try {
        if (decryptedMessage) output = naclUtil.encodeUTF8(decryptedMessage)
      } catch (err) {
        throw new Error('Decryption failed.')
      }

      if (output) {
        return output
      }
      throw new Error('Decryption failed.')
    }

    default:
      throw new Error('Encryption type/version not supported.')
  }
}

/**
 * Decrypt a message that has been encrypted using `encryptSafely`.
 *
 * @param options - The decryption options.
 * @param options.encryptedData - The encrypted data.
 * @param options.privateKey - The private key to decrypt with.
 * @returns The decrypted message.
 */
export function decryptSafely ({
  encryptedData,
  privateKey,
}: {
  encryptedData: EthEncryptedData;
  privateKey: string;
}): string {
  if (isNullish(encryptedData)) {
    throw new Error('Missing encryptedData parameter')
  } else if (isNullish(privateKey)) {
    throw new Error('Missing privateKey parameter')
  }

  const dataWithPadding = JSON.parse(decrypt({ encryptedData, privateKey }))
  return dataWithPadding.data
}

/**
 * Get the encryption public key for the given key.
 *
 * @param privateKey - The private key to generate the encryption public key with.
 * @returns The encryption public key.
 */
export function getEncryptionPublicKey (privateKey: string): string {
  const privateKeyUint8Array = naclDecodeHex(privateKey)
  const encryptionPublicKey =
    nacl.box.keyPair.fromSecretKey(privateKeyUint8Array).publicKey
  return naclUtil.encodeBase64(encryptionPublicKey)
}

/**
 * Convert a hex string to the UInt8Array format used by nacl.
 *
 * @param msgHex - The string to convert.
 * @returns The converted string.
 */
function naclDecodeHex (msgHex: string): Uint8Array {
  const msgBase64 = Buffer.from(msgHex, 'hex').toString('base64')
  return naclUtil.decodeBase64(msgBase64)
}
