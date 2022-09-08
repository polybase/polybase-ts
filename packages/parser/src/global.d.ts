import { Token } from 'nearley'

declare module 'nearly' {
  export interface Parser {
    reportError(token: Token, message: string): string
  }
}
