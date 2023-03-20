import { encodeToString, secp256k1, stripPublicKeyPrefix } from '@polybase/util'
import { ethPersonalSign } from '@polybase/eth'
import { Polybase, Collection, PublicKey, Signer, CollectionRecordReference } from '../src'
import { getPublicKey } from '@polybase/util/dist/algorithems/secp256k1'

jest.setTimeout(10000)

const BASE_API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080'
const API_URL = `${BASE_API_URL}/v0`
const wait = (time: number) => new Promise((resolve) => { setTimeout(resolve, time) })

const defaultSchema = (extraFields?: string) => `
@public
collection Col {
  id: string;
  name: string;
  info: {
    age: number;
  };
  aliases: string[];
  balances: map<string, number>;
  publicKey: string;
  ${extraFields ?? ''}

  @index(name);

  function constructor (id: string, name: string, age: number, aliases: string[], balances: map<string, number>) {
    this.id = id;
    this.name = name;
    this.info = { age: age };
    this.aliases = aliases;
    this.balances = balances;
    if (ctx.publicKey) this.publicKey = ctx.publicKey.toHex();
    else this.publicKey = '';
  }

  function setName (name: string) {
    this.name = name;
  }

  function setNameWithAuth (name: string) {
    if (this.publicKey != ctx.publicKey.toHex()) {
      error('you do not own this record');
    }
    this.name = name;
  }

  function takeOtherCol(otherCol: OtherCol) {}

  function destroy () {
    selfdestruct();
  }
}

@public
collection OtherCol {
  id: string;

  function constructor (id: string) {
    this.id = id;
  }
}
`

const createCollection = async (s: Polybase, namespace: string, schema?: string) => {
  const collections = await s.applySchema(schema || defaultSchema(), namespace)

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

  await c.create(['id1', 'Calum', 20, ['Cal'], { ETH: 1 }])
  const res = await c.record('id1').get()

  expect(res).toEqual({
    data: {
      id: 'id1',
      name: 'Calum',
      info: {
        age: 20,
      },
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

  await c.create(['id1', 'Calum', 20, [], {}])
  await c.record('id1').call('setName', ['Calum2'])
  const res = await c.record('id1').get()

  expect(res).toEqual({
    data: {
      id: 'id1',
      name: 'Calum2',
      info: {
        age: 20,
      },
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

  await col.create(['id1', 'Calum', 20, [], {}])

  await col.record('id1').call('takeOtherCol', [otherCol.record('id1')])
})

test('list data from collection', async () => {
  const namespace = `${prefix}-list-data`
  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum', 20, [], {}])
  await c.create(['id2', 'Sally', 21, [], {}])

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
        info: {
          age: 20,
        },
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
        info: {
          age: 21,
        },
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

  await c.create(['id1', 'Calum', 20, [], {}])
  await c.create(['id2', 'Sally', 21, [], {}])
  await c.create(['id3', 'Sally', 22, [], {}])

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
        info: {
          age: 21,
        },
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
        info: {
          age: 22,
        },
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

  await c.create(['id1', 'Calum', 20, [], {}])
  await c.create(['id2', 'Sally', 21, [], {}])
  await c.create(['id3', 'Sally', 22, [], {}])

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
        info: {
          age: 21,
        },
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
        info: {
          age: 22,
        },
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

  await c.create(['id1', 'Calum', 20, [], {}])
  await c.create(['id2', 'Sally', 21, [], {}])
  await c.create(['id3', 'John', 22, [], {}])

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
        info: {
          age: 20,
        },
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
        info: {
          age: 22,
        },
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
        info: {
          age: 21,
        },
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

  await c.create(['id1', 'Calum', 20, [], {}])

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
        info: {
          age: 20,
        },
        aliases: [],
        balances: {},
        publicKey: '',
      },
      block: {
        hash: expect.stringMatching(/^./),
      },
    }],
  })

  await c.create(['id4', 'Calum', 20, [], {}])

  unsub()
})

test('list data with cursor', async () => {
  const namespace = `${prefix}-list-with-cursor`
  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum', 20, [], {}])
  await c.create(['id2', 'Sally', 21, [], {}])

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
        info: {
          age: 20,
        },
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
        info: {
          age: 21,
        },
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
        info: {
          age: 20,
        },
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

test('list data with where on collection record field', async () => {
  const namespace = `${prefix}-record-ref-index`
  const accountCol: Collection<{ id: string, user: CollectionRecordReference }> = await createCollection(s, namespace, `
@public
collection Account {
  id: string;
  user?: User;

  @index(user);

  constructor (id: string, user?: User) {
    this.id = id;
    this.user = user;
  }
}

@public
collection User {
  id: string;

  constructor (id: string) {
    this.id = id;
  }
}
  `)

  const userCol = s.collection<{ id: string }>(namespace + '/User')

  const { data: user } = await userCol.create(['0'])
  const { data: user2 } = await userCol.create(['1'])

  const { data: account } = await accountCol.create(['0', {
    collectionId: userCol.id,
    id: user.id,
  }])

  const { data: account2 } = await accountCol.create(['1', {
    collectionId: userCol.id,
    id: user2.id,
  }])

  await accountCol.create(['2'])

  const list = await accountCol.where('user', '==', {
    collectionId: userCol.id,
    id: user.id,
  }).get()

  expect(list).toEqual({
    cursor: {
      after: expect.stringMatching(/^./),
      before: expect.stringMatching(/^./),
    },
    data: [{
      block: {
        hash: expect.stringMatching(/^./),
      },
      data: account,
    }],
  })

  const list2 = await accountCol.where('user', '==', {
    collectionId: userCol.id,
    id: user2.id,
  }).get()

  expect(list2).toEqual({
    cursor: {
      after: expect.stringMatching(/^./),
      before: expect.stringMatching(/^./),
    },
    data: [{
      block: {
        hash: expect.stringMatching(/^./),
      },
      data: account2,
    }],
  })

  const list3 = await accountCol.where('user', '==', s.collection(userCol.id).record(user2.id)).get()

  expect(list3).toEqual({
    cursor: {
      after: expect.stringMatching(/^./),
      before: expect.stringMatching(/^./),
    },
    data: [{
      block: {
        hash: expect.stringMatching(/^./),
      },
      data: account2,
    }],
  })
})

test('read access', async () => {
  const namespace = `${prefix}-read-access`
  const pv = secp256k1.generatePrivateKey()

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

  const c: Collection<{ id: string, publicKey: PublicKey }> = await createCollection(s, namespace, `
collection PrivateCol {
  id: string;
  @read
  publicKey: PublicKey;

  function constructor (id: string) {
    this.id = id;
    this.publicKey = ctx.publicKey;
  }
}
  `)

  await c.create(['id1'])

  const record = await c.record('id1').get()
  expect(record.data.id).toEqual('id1')
  expect(record.data.publicKey).toEqual({
    kty: 'EC',
    crv: 'secp256k1',
    alg: 'ES256K',
    use: 'sig',
    x: expect.any(String),
    y: expect.any(String),
  })

  s.signer((d: string) => {
    throw new Error('Signer should not be called')
  })
  const record2 = await c.record('id1').get()
  expect(record2.data.id).toEqual('id1')

  const list = await c.get()
  expect(list.data[0].data.id).toEqual('id1')

  const queryList = await c.where('id', '==', 'id1').get()
  expect(queryList.data[0].data.id).toEqual('id1')
})

test('array delegate access', async () => {
  const namespace = `${prefix}-array-delegate-access`
  const pv = secp256k1.generatePrivateKey()

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

  const c: Collection<any> = await createCollection(s, namespace, `
collection User {
  id: string;
  @delegate
  publicKey: PublicKey;

  constructor (id: string) {
    this.id = id;
    this.publicKey = ctx.publicKey;
  }
}

collection BankAccount {
  id: string;
  @read
  owners: User[];

  constructor (id: string, owners: User[]) {
    this.id = id;
    this.owners = owners;
  }
}
`)

  await c.create(['id1'])
  await c.create(['id2'])

  const bankCol = s.collection(`${namespace}/BankAccount`)
  await bankCol.create(['id1', [c.record('id1'), c.record('id2')]])

  const record = await bankCol.record('id1').get()
  expect(record.data.id).toEqual('id1')
  expect(record.data.owners).toEqual([
    { collectionId: `${namespace}/User`, id: 'id1' },
    { collectionId: `${namespace}/User`, id: 'id2' },
  ])

  s.signer(null as any as Signer)
  // Fails without auth
  return expect(bankCol.record('id1').get()).rejects.toThrow()
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
  expect(col.data.publicKey).toEqual({
    kty: 'EC',
    crv: 'secp256k1',
    alg: 'ES256K',
    use: 'sig',
    x: expect.any(String),
    y: expect.any(String),
  })

  await c.create(['id1', 'Calum2', 20, [], {}])

  const res = await c.record('id1').call('setName', ['Calum4'])

  expect(res.data).toEqual({
    publicKey: pk,
    id: 'id1',
    name: 'Calum4',
    info: {
      age: 20,
    },
    aliases: [],
    balances: {},
  })

  const res2 = await c.record('id1').get()
  expect(res2.data).toEqual({
    publicKey: pk,
    id: 'id1',
    name: 'Calum4',
    info: {
      age: 20,
    },
    aliases: [],
    balances: {},
  })

  await c.record('id1').call('setNameWithAuth', ['Calum5'])

  const res3 = await c.record('id1').get()
  expect(res3.data).toEqual({
    publicKey: pk,
    id: 'id1',
    name: 'Calum5',
    info: {
      age: 20,
    },
    aliases: [],
    balances: {},
  })
})

test('delete', async () => {
  const namespace = `${prefix}-delete`

  const c = await createCollection(s, namespace)

  await c.create(['id1', 'Calum2', 20, [], {}])
  await c.record('id1').call('destroy', [])

  await expect(c.record('id1').get()).rejects.toThrow()
})

test('bytes', async () => {
  const namespace = `${prefix}-bytes`

  const c = await createCollection(s, namespace, `
    @public
    collection Col {
      id: string;
      name: string;
      data: bytes;

      constructor (id: string, data: bytes) {
        this.id = id;
        this.name = id;
        this.data = data;
      }

      updateData (data: bytes) {
        this.data = data;
      }
    }
  `)

  const rec1 = await c.create(['rec1', new Uint8Array([0, 1, 2])])
  expect(rec1.data).toEqual({
    id: 'rec1',
    name: 'rec1',
    data: new Uint8Array([0, 1, 2]),
  })

  const rec1Updated = await c.record('rec1').call('updateData', [new Uint8Array([3, 4, 5])])
  expect(rec1Updated.data).toEqual({
    id: 'rec1',
    name: 'rec1',
    data: new Uint8Array([3, 4, 5]),
  })

  const list = await c.get()
  expect(list.data).toEqual([{
    data: {
      id: 'rec1',
      name: 'rec1',
      data: new Uint8Array([3, 4, 5]),
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  }])

  const listWhere = await c.where('name', '==', 'rec1').get()
  expect(listWhere.data).toEqual([{
    data: {
      id: 'rec1',
      name: 'rec1',
      data: new Uint8Array([3, 4, 5]),
    },
    block: {
      hash: expect.stringMatching(/^./),
    },
  }])
})

test('calls to functions with optional parameters', async () => {
  const namespace = `${prefix}-optional-params`

  const c = await createCollection(s, namespace, `
    @public
    collection Col {
      id: string;
      age?: number;

      constructor (id: string, age?: number) {
        this.id = id;
        this.age = age;
      }
    }
  `)

  const rec1 = await c.create(['rec1', 20])
  expect(rec1.data).toEqual({
    id: 'rec1',
    age: 20,
  })

  const rec2 = await c.create(['rec2'])
  expect(rec2.data).toEqual({
    id: 'rec2',
  })

  await expect(c.create([])).rejects.toThrow('incorrect number of arguments, expected 1, got 0')
  await expect(c.create(['rec3', 20, 30])).rejects.toThrow('incorrect number of arguments, expected 2, got 3')
})
