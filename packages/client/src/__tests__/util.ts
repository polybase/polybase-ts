export const defaultRequest = {
  signal: expect.objectContaining({}),
  params: {},
  headers: {
    'X-Polybase-Client': 'Polybase',
  },
}

export const wait = (time: number) => new Promise((resolve) => { setTimeout(resolve, time) })
