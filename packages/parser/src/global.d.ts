import 'nearley'

declare module 'nearly' {
  interface Parser {
    reportError(token: Token, message: string): string
  }
}
