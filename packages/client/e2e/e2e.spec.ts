import Wallet from 'ethereumjs-wallet'
import { ethPersonalSign } from '@polybase/eth'
import { Polybase, Collection } from '../src'

jest.setTimeout(10000)

const BASE_API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080'
const API_URL = `${BASE_API_URL}/v0`
const wait = (time: number) => new Promise((resolve) => { setTimeout(resolve, time) })
const createCollection = async (s: Polybase, namespace: string, extraFields?: string) => {
  const collections = await s.applySchema(`
    collection Col {
      id: string;
      name: string;
      publicKey: string;
      ${extraFields ?? ''}

      @index(name);

      function constructor (id: string, name: string) {
        this.id = id;
        this.name = name;
        this.publicKey = ctx.publicKey;
      }

      function setName (name: string) {
        this.name = name;
      }

      function setNameWithAuth (name: string) {
        if (this.publicKey != ctx.publicKey) {
          error('you do not own this record');
        }
        this.name = name;
      }

      function destroy () {
        selfdestruct();
      }
    }
  `, namespace)

  return collections[0]
}

const prefix = `test-${Date.now()}`

let s: Polybase

beforeEach(() => {
  s = new Polybase({
    baseURL: API_URL,
  })
})

test('create collection', async () => {
  const namespace = `${prefix}-create-collection`
  const c = await createCollection(s, namespace)
  expect(c).toBeInstanceOf(Collection)
  expect(c.id).toBe(namespace + '/Col')
})

test('create data on collection', async () => {
  const namespace = `${prefix}-create-data`
  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum'])
  const res = await c.doc('id1').get()

  expect(res).toEqual({
    data: {
      id: 'id1',
      name: 'Calum',
      publicKey: '',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  })
})

test('call setName on collection', async () => {
  const namespace = `${prefix}-update-data`
  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum'])
  await c.doc('id1').call('setName', ['Calum2'])
  const res = await c.doc('id1').get()

  expect(res).toEqual({
    data: {
      id: 'id1',
      name: 'Calum2',
      publicKey: '',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  })
})

test('list data from collection', async () => {
  const namespace = `${prefix}-list-data`
  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum'])
  await c.create(['id2', 'Sally'])

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
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }, {
      data: {
        id: 'id2',
        name: 'Sally',
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }],
  })
})

test('list data with == where clause', async () => {
  const namespace = `${prefix}-list-where-eq-data`
  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum'])
  await c.create(['id2', 'Sally'])
  await c.create(['id3', 'Sally'])

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
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }, {
      data: {
        id: 'id3',
        name: 'Sally',
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }],
  })
})

test('list data with > where clause', async () => {
  const namespace = `${prefix}-list-where-gt-data`
  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum'])
  await c.create(['id2', 'Sally'])
  await c.create(['id3', 'Sally'])

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
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }, {
      data: {
        id: 'id3',
        name: 'Sally',
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }],
  })
})

test('list data with sort clause', async () => {
  const namespace = `${prefix}-list-sorts-data`
  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum'])
  await c.create(['id2', 'Sally'])
  await c.create(['id3', 'John'])

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
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }, {
      data: {
        id: 'id3',
        name: 'John',
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }, {
      data: {
        id: 'id2',
        name: 'Sally',
        publicKey: '',
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

  await c.create(['id1', 'Calum'])

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
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }],
  })

  await c.create(['id4', 'Calum'])

  unsub()
})

test('list data with cursor', async () => {
  const namespace = `${prefix}-list-with-cursor`
  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum'])
  await c.create(['id2', 'Sally'])

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
        publicKey: '',
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
        publicKey: '',
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
        publicKey: '',
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

  s = new Polybase({
    baseURL: API_URL,
    signer: async (d: string) => {
      const sig = ethPersonalSign(wallet.getPrivateKey(), d)
      return {
        sig,
        h: 'eth-personal-sign',
      }
    },
  })

  const c = await createCollection(s, namespace)

  const col = await s.collection('Collection').doc(`${namespace}/Col`).get()
  expect(col.data.publicKey).toEqual(expect.stringContaining('0x'))

  await c.create(['id1', 'Calum2'])

  const res = await c.doc('id1').call('setName', ['Calum4'])

  expect(res.data).toEqual({
    publicKey: pk,
    id: 'id1',
    name: 'Calum4',
  })

  const res2 = await c.doc('id1').get()
  expect(res2.data).toEqual({
    publicKey: pk,
    id: 'id1',
    name: 'Calum4',
  })

  await c.doc('id1').call('setNameWithAuth', ['Calum5'])

  const res3 = await c.doc('id1').get()
  expect(res3.data).toEqual({
    publicKey: pk,
    id: 'id1',
    name: 'Calum5',
  })
})

test('delete', async () => {
  const namespace = `${prefix}-delete`

  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum2'])
  await c.doc('id1').call('destroy', [])

  await expect(c.doc('id1').get()).rejects.toThrow()
})
