import nearley from 'nearley'
/* eslint-disable-next-line import/no-unresolved, import/extensions */
import grammer from './lexer'

const { Parser } = nearley as any

Parser.prototype.reportError = function reportError (token: any) {
  const lines = []
  const tokenDisplay = (token.type ? `${token.type} token: ` : token) + JSON.stringify(token.value !== undefined ? token.value : token)
  lines.push(this.lexer.formatError(token, 'Syntax error'))
  lines.push(`Unexpected ${tokenDisplay}. Instead, I was expecting to see one of the following:\n`)
  // Removed lines, because they take a very long time to render!
  lines.push('')
  return lines.join('\n')
}

export default function parse (formula: string) {
  const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammer))
  return parser.feed(formula).results[0]
}
