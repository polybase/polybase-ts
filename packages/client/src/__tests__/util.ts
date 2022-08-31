export const defaultRequest = {
  signal: expect.objectContaining({}),
  params: {},
  headers: {
    'X-Spacetime-Client': 'Spacetime',
  },
}

export const wait = (time: number) => new Promise((resolve) => { setTimeout(resolve, time) })
