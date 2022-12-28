import { encodeToString, secp256k1, stripPublicKeyPrefix } from '@polybase/util'
import { ethPersonalSign } from '@polybase/eth'
import { Polybase, Collection } from '../src'
import { getPublicKey } from '@polybase/util/dist/algorithems/secp256k1'

jest.setTimeout(10000)

const BASE_API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080'
const API_URL = `${BASE_API_URL}/v0`
const wait = (time: number) => new Promise((resolve) => { setTimeout(resolve, time) })
const createCollection = async (s: Polybase, namespace: string, extraFields?: string) => {
  const collections = await s.applySchema(`
    collection Col {
      id: string;
      name: string;
      aliases: string[];
      balances: map<string, number>;
      publicKey: string;
      ${extraFields ?? ''}

      @index(name);

      function constructor (id: string, name: string, aliases: string[], balances: map<string, number>) {
        this.id = id;
        this.name = name;
        this.aliases = aliases;
        this.balances = balances;
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

      function takeOtherCol(otherCol: OtherCol) {}

      function destroy () {
        selfdestruct();
      }
    }

    collection OtherCol {
      id: string;

      function constructor (id: string) {
        this.id = id;
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

  await c.create(['id1', 'Calum', ['Cal'], { ETH: 1 }])
  const res = await c.record('id1').get()

  expect(res).toEqual({
    data: {
      id: 'id1',
      name: 'Calum',
      aliases: ['Cal'],
      balances: { ETH: 1 },
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

  await c.create(['id1', 'Calum', [], {}])
  await c.record('id1').call('setName', ['Calum2'])
  const res = await c.record('id1').get()

  expect(res).toEqual({
    data: {
      id: 'id1',
      name: 'Calum2',
      aliases: [],
      balances: {},
      publicKey: '',
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  })
})

// eslint-disable-next-line jest/expect-expect
test('call takeOtherCol', async () => {
  const namespace = `${prefix}-take-other-col`
  const col = await createCollection(s, namespace)

  const otherCol = s.collection(`${namespace}/OtherCol`)

  await otherCol.create(['id1'])

  await col.create(['id1', 'Calum', [], {}])

  await col.record('id1').call('takeOtherCol', [otherCol.record('id1')])
})

test('list data from collection', async () => {
  const namespace = `${prefix}-list-data`
  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum', [], {}])
  await c.create(['id2', 'Sally', [], {}])

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
        aliases: [],
        balances: {},
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }, {
      data: {
        id: 'id2',
        name: 'Sally',
        aliases: [],
        balances: {},
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

  await c.create(['id1', 'Calum', [], {}])
  await c.create(['id2', 'Sally', [], {}])
  await c.create(['id3', 'Sally', [], {}])

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
        aliases: [],
        balances: {},
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }, {
      data: {
        id: 'id3',
        name: 'Sally',
        aliases: [],
        balances: {},
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

  await c.create(['id1', 'Calum', [], {}])
  await c.create(['id2', 'Sally', [], {}])
  await c.create(['id3', 'Sally', [], {}])

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
        aliases: [],
        balances: {},
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }, {
      data: {
        id: 'id3',
        name: 'Sally',
        aliases: [],
        balances: {},
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

  await c.create(['id1', 'Calum', [], {}])
  await c.create(['id2', 'Sally', [], {}])
  await c.create(['id3', 'John', [], {}])

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
        aliases: [],
        balances: {},
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }, {
      data: {
        id: 'id3',
        name: 'John',
        aliases: [],
        balances: {},
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }, {
      data: {
        id: 'id2',
        name: 'Sally',
        aliases: [],
        balances: {},
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

  await c.create(['id1', 'Calum', [], {}])

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
        aliases: [],
        balances: {},
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }],
  })

  await c.create(['id4', 'Calum', [], {}])

  unsub()
})

test('list data with cursor', async () => {
  const namespace = `${prefix}-list-with-cursor`
  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum', [], {}])
  await c.create(['id2', 'Sally', [], {}])

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
        aliases: [],
        balances: {},
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
        aliases: [],
        balances: {},
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
        aliases: [],
        balances: {},
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
  const pv = await secp256k1.generatePrivateKey()
  // console.log(getPublicKey(pv))
  const pk = encodeToString(stripPublicKeyPrefix(getPublicKey(pv)), 'hex')

  s = new Polybase({
    baseURL: API_URL,
    signer: async (d: string) => {
      const sig = ethPersonalSign(pv, d)
      return {
        sig,
        h: 'eth-personal-sign',
      }
    },
  })

  const c = await createCollection(s, namespace)

  const col = await s.collection('Collection').record(`${namespace}/Col`).get()
  expect(col.data.publicKey).toEqual(expect.stringContaining('0x'))

  await c.create(['id1', 'Calum2', [], {}])

  const res = await c.record('id1').call('setName', ['Calum4'])

  expect(res.data).toEqual({
    publicKey: pk,
    id: 'id1',
    name: 'Calum4',
    aliases: [],
    balances: {},
  })

  const res2 = await c.record('id1').get()
  expect(res2.data).toEqual({
    publicKey: pk,
    id: 'id1',
    name: 'Calum4',
    aliases: [],
    balances: {},
  })

  await c.record('id1').call('setNameWithAuth', ['Calum5'])

  const res3 = await c.record('id1').get()
  expect(res3.data).toEqual({
    publicKey: pk,
    id: 'id1',
    name: 'Calum5',
    aliases: [],
    balances: {},
  })
})

test('delete', async () => {
  const namespace = `${prefix}-delete`

  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum2', [], {}])
  await c.record('id1').call('destroy', [])

  await expect(c.record('id1').get()).rejects.toThrow()
})
