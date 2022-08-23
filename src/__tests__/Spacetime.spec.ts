// import FakeTimers from '@sinonjs/fake-timers'
import { Spacetime } from '../Spacetime'
import { Collection } from '../Collection'
import { CollectionMeta } from '../types'

// const clock = FakeTimers.install()
const baseURL = 'https://base.com/'

let sender: jest.Mock

beforeEach(() => {
  sender = jest.fn()
})

test('spacetime is instance of Spacetime', () => {
  const s = new Spacetime()
  expect(s).toBeInstanceOf(Spacetime)
})

test('collection() returns collection', () => {
  const s = new Spacetime({ sender })
  expect(s.collection('a')).toBeInstanceOf(Collection)
})

test('collection is reused', () => {
  const s = new Spacetime({
    sender,
  })
  const a = s.collection('a')
  expect(s.collection('a')).toBe(a)
})

test('creates collection and returns it', async () => {
  const s = new Spacetime({ sender, baseURL })
  const meta: CollectionMeta = {
    id: 'new',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
      },
    },
  }
  const n = await s.createCollection(meta)

  expect(sender).toBeCalledWith({
    baseURL,
    url: '/$collections/new',
    method: 'POST',
    data: meta,
    params: {},
    signal: expect.objectContaining({}),
  })

  expect(n).toBeInstanceOf(Collection)
})
