const SYMM_KEY_ALGO_PARAMS = {
  name: 'AES-CBC',
  length: 256,
}

export async function generateSymmetricKey () {
  const symmKey = await crypto.subtle.generateKey(SYMM_KEY_ALGO_PARAMS, true, [
    'encrypt',
    'decrypt',
  ])
  return symmKey
}

export async function encryptWithSymmetricKey (symmKey: CryptoKey, data: Buffer) {
  const iv = crypto.getRandomValues(new Uint8Array(16))

  const encryptedZipData = await crypto.subtle.encrypt(
    { name: SYMM_KEY_ALGO_PARAMS.name, iv },
    symmKey,
    data,
  )

  const encryptedZipBlob = new Blob([iv, new Uint8Array(encryptedZipData)], {
    type: 'application/octet-stream',
  })

  return encryptedZipBlob
}

export async function decryptWithSymmetricKey (encryptedBlob: Blob, symmKey: any) {
  const recoveredIv = await encryptedBlob.slice(0, 16).arrayBuffer()
  const encryptedZipArrayBuffer = await encryptedBlob.slice(16).arrayBuffer()
  const decryptedZip = await crypto.subtle.decrypt(
    {
      name: SYMM_KEY_ALGO_PARAMS.name,
      iv: recoveredIv,
    },
    symmKey,
    encryptedZipArrayBuffer,
  )
  return decryptedZip
}

export async function importSymmetricKey (symmKey: Uint8Array) {
  const importedSymmKey = await crypto.subtle.importKey(
    'raw',
    symmKey,
    SYMM_KEY_ALGO_PARAMS,
    true,
    ['encrypt', 'decrypt'],
  )

  return importedSymmKey
}
