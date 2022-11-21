import Wallet from 'ethereumjs-wallet'
import { asymmetricEncrypt, asymmetricDecrypt, getPublicKey, getPublicCompressed } from '../secp256k1'
import { encodeToString } from '../../util'

test('decrypt/encrypt: 64 bit key', async function () {
  // Generate private key
  const wallet = Wallet.generate()
  const publicKey = wallet.getPublicKey()
  const privateKey = wallet.getPrivateKey()

  const str = 'hello world'
  const encrypted = await asymmetricEncrypt(publicKey, Buffer.from(str))
  const decrypted = await asymmetricDecrypt(privateKey, encrypted)
  expect(encodeToString(decrypted, 'utf8')).toEqual('hello world')
})

test('decrypt/encrypt: 65 bit key', async function () {
  // Generate private key
  const wallet = Wallet.generate()
  const privateKey = wallet.getPrivateKey()
  const publicKey = getPublicKey(privateKey)

  const str = 'hello world'
  const encrypted = await asymmetricEncrypt(publicKey, Buffer.from(str))
  const decrypted = await asymmetricDecrypt(privateKey, encrypted)
  expect(encodeToString(decrypted, 'utf8')).toEqual('hello world')
})

test('decrypt/encrypt: 33 bit key', async function () {
  // Generate private key
  const wallet = Wallet.generate()
  const privateKey = wallet.getPrivateKey()
  const publicKey = getPublicCompressed(privateKey)

  const str = 'hello world'
  const encrypted = await asymmetricEncrypt(publicKey, Buffer.from(str))
  const decrypted = await asymmetricDecrypt(privateKey, encrypted)
  expect(encodeToString(decrypted, 'utf8')).toEqual('hello world')
})
