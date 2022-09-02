import Wallet from 'ethereumjs-wallet'
import { ethPersonalSign } from '@spacetimexyz/eth'
import { Spacetime, CollectionMeta, Collection } from '../src'

jest.setTimeout(10000)

const BASE_API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080'
const API_URL = `${BASE_API_URL}/v0/data`
const wait = (time: number) => new Promise((resolve) => { setTimeout(resolve, time) })
const createCollection = (s: Spacetime, id: string) => {
  const meta: CollectionMeta = {
    id,
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
    },
    indexes: [{
      fields: [{ field: 'name' }],
    }],
  }

  return s.createCollection(meta)
}

const prefix = `test-${Date.now()}`

let s: Spacetime

beforeEach(() => {
  s = new Spacetime({
    baseURL: API_URL,
  })
})

test('create collection', async () => {
  const id = `${prefix}-create-collection`
  const c = await createCollection(s, id)
  expect(c).toBeInstanceOf(Collection)
  expect(c.id).toBe(id)
})

test('set data on collection', async () => {
  const id = `${prefix}-add-data`
  const c = await createCollection(s, id)

  await c.doc('id1').set({
    name: 'Calum',
  })

  await c.doc('id1').set({
    name: 'Calum2',
  })

  const res = await c.doc('id1').set({
    name: 'Calum',
  })

  expect(res).toEqual({
    data: {
      id: 'id1',
      name: 'Calum',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  })
})

test('get data from collection', async () => {
  const id = `${prefix}-get-data`
  const c = await createCollection(s, id)

  await c.doc('id1').set({
    name: 'Calum',
  })
  const res = await c.doc('id1').get()

  expect(res).toEqual({
    data: {
      id: 'id1',
      name: 'Calum',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  })
})

test('list data from collection', async () => {
  const id = `${prefix}-list-data`
  const c = await createCollection(s, id)

  await c.doc('id1').set({
    name: 'Calum',
  })

  await c.doc('id2').set({
    name: 'Sally',
  })

  const res = await c.get()

  expect(res).toEqual([{
    data: {
      id: 'id1',
      name: 'Calum',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  }, {
    data: {
      id: 'id2',
      name: 'Sally',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  }])
})

test('list data with == where clause', async () => {
  const id = `${prefix}-list-where-data`
  const c = await createCollection(s, id)

  await c.doc('id1').set({
    name: 'Calum',
  })

  await c.doc('id2').set({
    name: 'Sally',
  })

  await c.doc('id3').set({
    name: 'Sally',
  })

  const res = await c.where('name', '==', 'Sally').get()

  expect(res).toEqual([{
    data: {
      id: 'id2',
      name: 'Sally',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  }, {
    data: {
      id: 'id3',
      name: 'Sally',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  }])
})

test('list data with > where clause', async () => {
  const id = `${prefix}-list-where-data`
  const c = await createCollection(s, id)

  await c.doc('id1').set({
    name: 'Calum',
  })

  await c.doc('id2').set({
    name: 'Sally',
  })

  await c.doc('id3').set({
    name: 'Sally',
  })

  const res = await c.where('name', '>', 'John').get()

  expect(res).toEqual([{
    data: {
      id: 'id2',
      name: 'Sally',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  }, {
    data: {
      id: 'id3',
      name: 'Sally',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  }])
})

test('list data with sort clause', async () => {
  const id = `${prefix}-list-where-data`
  const c = await createCollection(s, id)

  await c.doc('id1').set({
    name: 'Calum',
  })

  await c.doc('id2').set({
    name: 'Sally',
  })

  await c.doc('id3').set({
    name: 'John',
  })

  const res = await c.sort('name').get()

  expect(res).toEqual([{
    data: {
      id: 'id1',
      name: 'Calum',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  }, {
    data: {
      id: 'id3',
      name: 'John',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  }, {
    data: {
      id: 'id2',
      name: 'Sally',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  }])
})

test('list data with snapshot', async () => {
  const id = `${prefix}-list-with-snapshot`
  const c = await createCollection(s, id)

  await c.doc('id1').set({
    name: 'Calum',
  })

  const spy = jest.fn()
  const q = c.where('name', '==', 'Calum')

  const unsub = q.onSnapshot(spy)

  await wait(2000)

  expect(spy).toBeCalledTimes(1)
  expect(spy).toBeCalledWith([{
    data: {
      id: 'id1',
      name: 'Calum',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  }])

  await c.doc('id4').set({
    name: 'Calum',
  })

  unsub()
})

test('signing', async () => {
  const id = `${prefix}-signing`
  const wallet = Wallet.generate()
  const pk = `0x${wallet.getPublicKey().toString('hex')}`

  s = new Spacetime({
    baseURL: API_URL,
    signer: async (d: string) => {
      const sig = ethPersonalSign(wallet.getPrivateKey(), d)
      return {
        sig,
        h: 'eth-personal-sign',
      }
    },
  })

  const c = await createCollection(s, id)

  await c.doc('id1').set({ name: 'Calum2' }, [pk])

  const res = await c.doc('id1').set({ name: 'Calum4' }, [pk])

  await expect(res.data).toEqual({
    $pk: pk,
    id: 'id1',
    name: 'Calum4',
  })

  await c.doc('id1').delete()
  await expect(c.doc('id1').get()).rejects.toThrow()
})

test('delete', async () => {
  const id = `${prefix}-delete`

  const c = await createCollection(s, id)

  await c.doc('id1').set({ name: 'Calum2' }, [])
  await c.doc('id1').delete()

  await expect(c.doc('id').get()).rejects.toThrow()
})
