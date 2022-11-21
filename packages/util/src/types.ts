export type EncryptedData = EncryptedDataSecp256k1|EncryptedDataX25519
export type EncryptedDataVersion = EncryptedData['version']

export interface EncryptedDataBase {
  // AKA IV
  nonce: Uint8Array
  ephemPublicKey: Uint8Array
  ciphertext: Uint8Array
}

export interface EncryptedDataSecp256k1 extends EncryptedDataBase {
  version: 'secp256k1'
  mac: Uint8Array
}

export interface EncryptedDataX25519 extends EncryptedDataBase {
  version: 'x25519-xsalsa20-poly1305'
}

export interface KeyPair {
  version: EncryptedDataVersion
  publicKey: Uint8Array
  privateKey: Uint8Array
}
