export type EncryptedData = EncryptedDataSecp256k1|EncryptedAsymmetricX25519|EncryptedSymmetricX25519|EncryptedDataAesCbc256
export type EncryptedDataVersion = EncryptedData['version']

export interface EncryptedDataBase {
  // AKA IV
  nonce: Uint8Array
  ciphertext: Uint8Array
}

export interface EncryptedDataSecp256k1 extends EncryptedDataBase {
  version: 'secp256k1/asymmetric'
  ephemPublicKey: Uint8Array
  mac: Uint8Array
}

export type EncryptedDataX25519 = EncryptedAsymmetricX25519|EncryptedSymmetricX25519

export interface EncryptedAsymmetricX25519 extends EncryptedDataBase {
  version: 'x25519-xsalsa20-poly1305/asymmetric'
  ephemPublicKey: Uint8Array
}

export interface EncryptedSymmetricX25519 extends EncryptedDataBase {
  version: 'x25519-xsalsa20-poly1305/symmetric'
}

export interface EncryptedDataAesCbc256 extends EncryptedDataBase {
  version: 'aes-cbc-256/symmetric'
}

export interface KeyPair {
  version: EncryptedDataVersion
  publicKey: Uint8Array
  privateKey: Uint8Array
}
