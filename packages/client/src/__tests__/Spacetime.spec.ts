// import FakeTimers from '@sinonjs/fake-timers'
import { Spacetime } from '../Spacetime'
import { Collection } from '../Collection'
import { CollectionMeta } from '../types'
import { defaultRequest } from './util'

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
    code: `
      collection Col {
        id: string!;
        name: string;
      }
    `,
  }
  const n = await s.createCollection(meta)

  expect(sender).toHaveBeenCalledWith({
    ...defaultRequest,
    baseURL,
    url: '/$collections/new',
    method: 'POST',
    data: {
      data: meta,
    },
    headers: {
      'X-Spacetime-Client': 'spacetime@ts/client:v0',
    },
  })

  expect(n).toBeInstanceOf(Collection)
})

test('caches a collection', () => {
  const s = new Spacetime({ sender, baseURL })

  const c1 = s.collection('hello')
  const c2 = s.collection('hello')

  expect(c1).toBe(c2)
})
