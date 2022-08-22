import { AxiosRequestConfig } from 'axios'
import { Request } from './types'

export function toAxiosRequest (req: Request): AxiosRequestConfig {
  return {
    url: req.url,
    params: {
      ...req.params,
      where: req.params?.where ? JSON.stringify(req.params?.where) : undefined,
    },
  }
}
