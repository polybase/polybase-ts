import Wallet from 'ethereumjs-wallet'
import { ethPersonalSign } from '@spacetimexyz/eth'
import { Spacetime, Collection } from '../src'

jest.setTimeout(10000)

const BASE_API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080'
const API_URL = `${BASE_API_URL}/v0`
const wait = (time: number) => new Promise((resolve) => { setTimeout(resolve, time) })
const createCollection = async (s: Spacetime, namespace: string, extraFields?: string) => {
  const collections = await s.applySchema(`
    collection Col {
      id: string!;
      name: string;
      $pk: string;
      ${extraFields ?? ''}

      @index(name);

      function setName(a: record, name: string) {
        a.name = name;
      }

      function setNameWithAuth(a: record, name: string) {
        if (a.$pk != $auth.publicKey) throw error('you do not own this record');

        a.name = name;
      }
    }
  `, namespace)

  return collections[0]
}

const prefix = `test-${Date.now()}`

let s: Spacetime

beforeEach(() => {
  s = new Spacetime({
    baseURL: API_URL,
  })
})

test('create collection', async () => {
  const namespace = `${prefix}-create-collection`
  const c = await createCollection(s, namespace)
  expect(c).toBeInstanceOf(Collection)
  expect(c.id).toBe(namespace + '/Col')
})

test('set data on collection', async () => {
  const namespace = `${prefix}-add-data`
  const c = await createCollection(s, namespace)

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
  const namespace = `${prefix}-get-data`
  const c = await createCollection(s, namespace)

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
  const namespace = `${prefix}-list-data`
  const c = await createCollection(s, namespace)

  await c.doc('id1').set({
    name: 'Calum',
  })

  await c.doc('id2').set({
    name: 'Sally',
  })

  const res = await c.get()

  expect(res).toEqual({
    cursor: {
      after: expect.stringMatching(/^./),
      before: expect.stringMatching(/^./),
    },
    data: [{
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
    }],
  })
})

test('list data with == where clause', async () => {
  const namespace = `${prefix}-list-where-data`
  const c = await createCollection(s, namespace)

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

  expect(res).toEqual({
    cursor: {
      after: expect.stringMatching(/^./),
      before: expect.stringMatching(/^./),
    },
    data: [{
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
    }],
  })
})

test('list data with > where clause', async () => {
  const namespace = `${prefix}-list-where-data`
  const c = await createCollection(s, namespace)

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

  expect(res).toEqual({
    cursor: {
      after: expect.stringMatching(/^./),
      before: expect.stringMatching(/^./),
    },
    data: [{
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
    }],
  })
})

test('list data with sort clause', async () => {
  const namespace = `${prefix}-list-where-data`
  const c = await createCollection(s, namespace)

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

  expect(res).toEqual({
    cursor: {
      after: expect.stringMatching(/^./),
      before: expect.stringMatching(/^./),
    },
    data: [{
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
    }],
  })
})

test('list data with snapshot', async () => {
  const namespace = `${prefix}-list-with-snapshot`
  const c = await createCollection(s, namespace)

  await c.doc('id1').set({
    name: 'Calum',
  })

  const spy = jest.fn()
  const q = c.where('name', '==', 'Calum')

  const unsub = q.onSnapshot(spy)

  await wait(2000)

  expect(spy).toHaveBeenCalledTimes(1)
  expect(spy).toHaveBeenCalledWith({
    cursor: {
      after: expect.stringMatching(/^./),
      before: expect.stringMatching(/^./),
    },
    data: [{
      data: {
        id: 'id1',
        name: 'Calum',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }],
  })

  await c.doc('id4').set({
    name: 'Calum',
  })

  unsub()
})

test('list data with cursor', async () => {
  const namespace = `${prefix}-list-with-cursor`
  const c = await createCollection(s, namespace)

  await c.doc('id1').set({
    name: 'Calum',
  })

  await c.doc('id2').set({
    name: 'Sally',
  })

  const first = await c.limit(1).get()
  expect(first).toEqual({
    cursor: {
      before: expect.stringMatching(/^./),
      after: expect.stringMatching(/^./),
    },
    data: [{
      data: {
        id: 'id1',
        name: 'Calum',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }],
  })

  const second = await c.limit(1).after(first.cursor.after).get()
  expect(second).toEqual({
    cursor: {
      before: expect.stringMatching(/^./),
      after: expect.stringMatching(/^./),
    },
    data: [{
      data: {
        id: 'id2',
        name: 'Sally',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }],
  })

  const firstWithBefore = await c.limit(1).before(second.cursor.before).get()
  expect(firstWithBefore).toEqual({
    cursor: {
      before: expect.stringMatching(/^./),
      after: expect.stringMatching(/^./),
    },
    data: [{
      data: {
        id: 'id1',
        name: 'Calum',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }],
  })
})

test('signing', async () => {
  const namespace = `${prefix}-signing`
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

  const c = await createCollection(s, namespace, 'publicKey: string @creator;')

  await c.doc('id1').set({ name: 'Calum2' }, [pk])

  const res = await c.doc('id1').set({ name: 'Calum4' }, [pk])

  expect(res.data).toEqual({
    $pk: pk,
    publicKey: pk,
    id: 'id1',
    name: 'Calum4',
  })

  const res2 = await c.doc('id1').get()
  expect(res2.data).toEqual({
    $pk: pk,
    publicKey: pk,
    id: 'id1',
    name: 'Calum4',
  })

  await c.call('setNameWithAuth', [c.doc('id1'), 'Calum5'], pk)

  const res3 = await c.doc('id1').get()
  expect(res3.data).toEqual({
    $pk: pk,
    publicKey: pk,
    id: 'id1',
    name: 'Calum5',
  })

  await c.doc('id1').delete()
  await expect(c.doc('id1').get()).rejects.toThrow()
})

test('delete', async () => {
  const namespace = `${prefix}-delete`

  const c = await createCollection(s, namespace)

  await c.doc('id1').set({ name: 'Calum2' }, [])
  await c.doc('id1').delete()

  await expect(c.doc('id').get()).rejects.toThrow()
})

test('call', async () => {
  const namespace = `${prefix}-call`

  const c = await createCollection(s, namespace)

  await c.doc('id1').set({ name: 'Calum2' })

  await c.call('setName', [c.doc('id1'), 'Calum3'])

  const res = await c.doc('id1').get()
  expect(res.data).toEqual({
    id: 'id1',
    name: 'Calum3',
  })
})
