import { resolve } from 'path'

export async function setupBrowser () {
  // To use crypto.subtle, we need to be in a secure or local context,
  // so we use a file:// URL.
  await page.goto('file:///dev/null')
  await page.addScriptTag({
    path: resolve(__dirname, '../../dist/bundle.min.js'),
  })
}

export async function testNodeAndBrowser<T> (
  fn: (input: { index: typeof import('../') }) => T,
  fromParsedJSON: (json: unknown) => Awaited<T>,
  expectFn: (t: Awaited<T>) => void,
) {
  const node = async () => {
    const t = await fn({ index: await import('../../') })
    // JSON stringify and parse to get the same output as from Page#evaluate
    return JSON.parse(JSON.stringify(t))
  }

  const browser = async () => {
    return await page.evaluate(`
      (() => {
        const test = ${fn}
        return test({ index: polybase_util })
      })()
    `)
  }

  const testOutput = async (output: unknown) => {
    const t = fromParsedJSON(output)
    expectFn(t)
  }

  await testOutput(await node())
  await testOutput(await browser())
}

// Uint8Array gets JSON.stringified/parsed to an object with keys 0, 1, 2, etc.
export function jsonObjectToUint8Array (obj: unknown): Uint8Array {
  if (typeof obj !== 'object' || obj === null) {
    throw new Error('expected object')
  }

  const keys = Object.keys(obj)
  const length = keys.length
  const array = new Uint8Array(length)

  for (let i = 0; i < length; i++) {
    const key = keys[i]
    const value = (obj as any)[key]

    if (typeof value !== 'number') {
      throw new Error('expected number')
    }

    array[i] = value
  }

  return array
}
