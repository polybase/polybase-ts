import Wallet from 'ethereumjs-wallet'
import eccrypto from 'eccrypto'
import * as nacl from 'tweetnacl'
import {
  asymmetricEncrypt,
  asymmetricDecrypt,
  asymmetricEncryptToHex,
  asymmetricDecryptFromHex,
} from '../asymmetric'

test('decrypt/encrypt: 64 bit key', async function () {
  // Generate private key
  const wallet = Wallet.generate()
  const publicKey = wallet.getPublicKey()
  const privateKey = wallet.getPrivateKey()

  const str = 'hello world'
  const encrypted = await asymmetricEncrypt(publicKey, Buffer.from(str))
  const decrypted = await asymmetricDecrypt(privateKey, encrypted)
  expect(decrypted.toString()).toEqual('hello world')
})

test('decrypt/encrypt: 65 bit key', async function () {
  // Generate private key
  const wallet = Wallet.generate()
  const privateKey = wallet.getPrivateKey()
  const publicKey = eccrypto.getPublic(privateKey)

  const str = 'hello world'
  const encrypted = await asymmetricEncrypt(publicKey, Buffer.from(str))
  const decrypted = await asymmetricDecrypt(privateKey, encrypted)
  expect(decrypted.toString()).toEqual('hello world')
})

test('decrypt/encrypt: 33 bit key', async function () {
  // Generate private key
  const wallet = Wallet.generate()
  const privateKey = wallet.getPrivateKey()
  const publicKey = eccrypto.getPublicCompressed(privateKey)

  const str = 'hello world'
  const encrypted = await asymmetricEncrypt(publicKey, Buffer.from(str))
  const decrypted = await asymmetricDecrypt(privateKey, encrypted)
  expect(decrypted.toString()).toEqual('hello world')
})

test('decrypt/encrypt to hex', async function () {
  // Generate private key
  const wallet = Wallet.generate()
  const publicKey = wallet.getPublicKey()
  const privateKey = wallet.getPrivateKey()

  const str = 'hello world'
  const encrypted = await asymmetricEncryptToHex(publicKey, str)
  const decrypted = await asymmetricDecryptFromHex(privateKey, encrypted)
  expect(decrypted.toString()).toEqual('hello world')
})

test('decrypt/encrypt x25519-xsalsa20-poly1305', async () => {
  const { publicKey, secretKey } = nacl.box.keyPair()
  const str = 'hello world'
  const encrypted = await asymmetricEncryptToHex(publicKey, str, 'x25519-xsalsa20-poly1305')
  const decrypted = await asymmetricDecryptFromHex(secretKey, encrypted)
  expect(decrypted.toString()).toEqual('hello world')
})
