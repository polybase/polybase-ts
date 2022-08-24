import { Spacetime, CollectionMeta, Collection } from '../src'

jest.setTimeout(7000)

const BASE_API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080'
const API_URL = `${BASE_API_URL}/v0/data`
const wait = (time: number) => new Promise((resolve) => { setTimeout(resolve, time) })

const id = `test-${Date.now()}`

let s: Spacetime

beforeEach(() => {
  s = new Spacetime({
    baseURL: API_URL,
  })
})

test('create collection', async () => {
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

  const res = await s.createCollection(meta)
  expect(res).toBeInstanceOf(Collection)
  expect(res.id).toBe(id)
})

test('add data to collection', async () => {
  const c = await s.collection(id)

  const res = await c.doc('id1').set({
    name: 'Calum',
  })

  expect(res).toEqual({
    data: {
      id: 'id1',
      name: 'Calum',
    },
    block: expect.stringMatching(/^./),
  })
})

test('get data from collection', async () => {
  const c = await s.collection(id)
  const res = await c.doc('id1').get()

  expect(res).toEqual({
    data: {
      id: 'id1',
      name: 'Calum',
    },
    // block: expect.stringMatching(/^./),
  })
})

test('list data from collection', async () => {
  const c = await s.collection(id)
  await c.doc('id2').set({
    name: 'Sally',
  })

  const res = await c.get()

  expect(res).toEqual([{
    data: {
      id: 'id1',
      name: 'Calum',
    },
    // block: expect.stringMatching(/^./),
  }, {
    data: {
      id: 'id2',
      name: 'Sally',
    },
  }])
})

test('list data with where clause', async () => {
  const c = await s.collection(id)
  await c.doc('id3').set({
    name: 'Sally',
  })

  const res = await c.where('name', '==', 'Sally').get()

  expect(res).toEqual([{
    data: {
      id: 'id2',
      name: 'Sally',
    },
    // block: expect.stringMatching(/^./),
  }, {
    data: {
      id: 'id3',
      name: 'Sally',
    },
  }])
})

test('list data with snapshot', async () => {
  const c = await s.collection(id)
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
  }])

  // await c.doc('id4').set({
  //   name: 'Calum',
  // })

  // await wait(3000)

  // expect(spy).toBeCalledTimes(2)
  // expect(spy).toBeCalledWith([{
  //   data: {
  //     id: 'id1',
  //     name: 'Calum',
  //   },
  // }, {
  //   data: {
  //     id: 'id4',
  //     name: 'Calum',
  //   },
  // }])

  unsub()
})
