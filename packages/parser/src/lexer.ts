// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id (d: any[]): any { return d[0] }
declare let semi: any
declare let name: any
declare let lcurly: any
declare let rcurly: any
declare let colon: any
declare let bang: any
declare let lparen: any
declare let rparen: any
declare let comma: any
declare let assign: any
declare let assignplus: any
declare let assignminus: any
declare let or: any
declare let and: any
declare let gt: any
declare let gte: any
declare let lt: any
declare let lte: any
declare let eq: any
declare let neq: any
declare let concat: any
declare let plus: any
declare let minus: any
declare let times: any
declare let divide: any
declare let percent: any
declare let not: any
declare let power: any
declare let string: any
declare let boolean: any
declare let number: any
declare let lbracket: any
declare let rbracket: any
declare let dot: any
declare let ws: any

const moo = require('moo')

const lexer = moo.compile({
  // nl: { match: /\n/, lineBreaks: true },
  ws: { match: /[ \t\n]+/, lineBreaks: true },
  // ws: /[ \t]+/,
  boolean: /true|false/,
  and: '&&',
  or: /or|\|\|/,
  not: 'not',
  lparen: '(',
  rparen: ')',
  lbracket: '[',
  rbracket: ']',
  lcurly: '{',
  rcurly: '}',
  colon: ':',
  name: /[a-zA-Z0-9_$]*[a-zA-Z_$]+[a-zA-Z0-9_$]*/,
  number: /(?:[1-9][0-9]+|[0-9])(?:\.[0-9]+)?/,
  string: { match: /"(?:\\["\\]|[^\n"\\])*"|'(?:\\['\\]|[^\n'\\])*'/, value: (s: string) => s.slice(1, -1).replace(/\\"/g, '"') },
  dot: '.',
  gte: '>=',
  lte: '<=',
  gt: '>',
  lt: '<',
  eq: '==',
  assign: '=',
  assignplus: '+=',
  assignminus: '-=',
  neq: '!=',
  plus: '+',
  minus: '-',
  concat: '&',
  power: /\^|\*\*/,
  times: '*',
  divide: '/',
  percent: '%',
  at: '@',
  bang: '!',
  comma: ',',
  semi: ';',
})

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    { name: 'Root', symbols: ['_', 'RootBlock', '_'], postprocess: ([_, root]) => root },
    { name: 'RootBlock', symbols: ['RootStatement'] },
    { name: 'RootBlock', symbols: ['RootBlock', '_', (lexer.has('semi') ? { type: 'semi' } : semi), '_', 'RootStatement'], postprocess: ([list, _2, _3, _4, exp]) => [].concat(list, exp) },
    { name: 'RootBlock', symbols: ['RootBlock', '__', 'RootStatement'], postprocess: ([list, _2, exp]) => [].concat(list, exp) },
    { name: 'RootStatement', symbols: ['Collection'], postprocess: id },
    { name: 'RootStatement', symbols: ['Function'], postprocess: id },
    { name: 'Collection', symbols: [{ literal: 'collection' }, '__', (lexer.has('name') ? { type: 'name' } : name), '_', (lexer.has('lcurly') ? { type: 'lcurly' } : lcurly), '_', 'CollectionBlockList', '_', (lexer.has('rcurly') ? { type: 'rcurly' } : rcurly)], postprocess: ([_1, _2, name, _4, _5, _6, fields]) => ({ type: 'collection', name, fields }) },
    { name: 'CollectionBlockList', symbols: ['CollectionBlock'] },
    { name: 'CollectionBlockList', symbols: ['CollectionBlockList', '__', 'CollectionBlock'], postprocess: ([list, _2, exp]) => [].concat(list, exp) },
    { name: 'CollectionBlockList', symbols: ['CollectionBlockList', '_', (lexer.has('semi') ? { type: 'semi' } : semi), '_', 'CollectionBlock'], postprocess: ([list, _2, _3, _4, exp]) => [].concat(list, exp) },
    { name: 'CollectionBlock', symbols: ['CollectionKeyValuePair'], postprocess: id },
    { name: 'CollectionBlock', symbols: ['Function'], postprocess: id },
    { name: 'CollectionKeyValuePair', symbols: [(lexer.has('name') ? { type: 'name' } : name), '_', (lexer.has('colon') ? { type: 'colon' } : colon), '_', (lexer.has('name') ? { type: 'name' } : name)], postprocess: ([name, _2, _3, _4, kind]) => ({ type: 'field', name, kind }) },
    { name: 'CollectionKeyValuePair', symbols: [(lexer.has('name') ? { type: 'name' } : name), '_', (lexer.has('colon') ? { type: 'colon' } : colon), '_', (lexer.has('name') ? { type: 'name' } : name), (lexer.has('bang') ? { type: 'bang' } : bang)], postprocess: ([name, _2, _3, _4, kind]) => ({ type: 'field', name, kind, required: true }) },
    { name: 'CollectionKeyValuePair', symbols: [(lexer.has('name') ? { type: 'name' } : name), '__', (lexer.has('name') ? { type: 'name' } : name)], postprocess: ([name, _2, kind]) => ({ type: 'field', name, kind }) },
    { name: 'CollectionKeyValuePair', symbols: [(lexer.has('name') ? { type: 'name' } : name), '__', (lexer.has('name') ? { type: 'name' } : name), (lexer.has('bang') ? { type: 'bang' } : bang)], postprocess: ([name, _2, kind]) => ({ type: 'field', name, kind, required: true }) },
    { name: 'Function', symbols: [{ literal: 'function' }, '__', (lexer.has('name') ? { type: 'name' } : name), '_', 'FunctionParams', '_', 'FunctionBody'], postprocess: ([_1, _2, name, _4, params, _6, body]) => ({ type: 'function', name, params, body }) },
    { name: 'FunctionBody', symbols: [(lexer.has('lcurly') ? { type: 'lcurly' } : lcurly), '__', 'Block', '__', (lexer.has('rcurly') ? { type: 'rcurly' } : rcurly)], postprocess: ([_1, _2, block]) => block },
    { name: 'FunctionParams', symbols: [(lexer.has('lparen') ? { type: 'lparen' } : lparen), '_', 'FunctionParamsList', '_', (lexer.has('rparen') ? { type: 'rparen' } : rparen)], postprocess: ([_1, params]) => params },
    { name: 'FunctionParams', symbols: [(lexer.has('lparen') ? { type: 'lparen' } : lparen), '_', (lexer.has('rparen') ? { type: 'rparen' } : rparen)], postprocess: () => [] },
    { name: 'FunctionParamsList', symbols: [(lexer.has('name') ? { type: 'name' } : name)] },
    { name: 'FunctionParamsList', symbols: ['FunctionParamsList', '_', (lexer.has('comma') ? { type: 'comma' } : comma), '_', (lexer.has('name') ? { type: 'name' } : name)] },
    { name: 'Block', symbols: ['Statement'] },
    { name: 'Block', symbols: ['Block', '_', (lexer.has('semi') ? { type: 'semi' } : semi), '_', 'Statement'], postprocess: ([list, _2, _3, _4, exp]) => [].concat(list, exp) },
    { name: 'Block', symbols: ['Block', '__', 'Statement'], postprocess: ([list, _2, exp]) => [].concat(list, exp) },
    { name: 'Statement', symbols: ['If'], postprocess: id },
    { name: 'Statement', symbols: ['Const'], postprocess: id },
    { name: 'Statement', symbols: ['Let'], postprocess: id },
    { name: 'Statement', symbols: ['Return'], postprocess: id },
    { name: 'Statement', symbols: ['Assign'], postprocess: id },
    { name: 'If', symbols: [{ literal: 'if' }, '__', 'Exp', '__', (lexer.has('lcurly') ? { type: 'lcurly' } : lcurly), '__', 'Block', '__', 'Elses'], postprocess: ([_1, _2, exp, _4, _5, _6, block, _8, elses]) => ({ type: 'if', expression: exp, block, elses }) },
    { name: 'Elses', symbols: [(lexer.has('rcurly') ? { type: 'rcurly' } : rcurly)], postprocess: () => [] },
    { name: 'Elses', symbols: [{ literal: 'else' }, (lexer.has('lcurly') ? { type: 'lcurly' } : lcurly), '__', 'Block', '__', (lexer.has('rcurly') ? { type: 'rcurly' } : rcurly)], postprocess: ([_1, _2, _3, block]) => ({ type: 'else', expression: null, block }) },
    { name: 'Elses', symbols: [{ literal: 'else' }, '__', { literal: 'if' }, '__', 'Exp', '__', (lexer.has('lcurly') ? { type: 'lcurly' } : lcurly), '__', 'Block', '__', (lexer.has('rcurly') ? { type: 'rcurly' } : rcurly)], postprocess: ([_1, _2, _3, _4, exp, _6, block]) => ({ type: 'elseif', expression: exp, block }) },
    { name: 'Elses', symbols: ['Elses', '__', { literal: 'else' }, '__', (lexer.has('lcurly') ? { type: 'lcurly' } : lcurly), '__', 'Block', '__', (lexer.has('rcurly') ? { type: 'rcurly' } : rcurly)], postprocess: ([list, _2, _3, _4, _5, _6, block]) => [].concat(list, { type: 'else', expression: null, block } as any) },
    { name: 'Elses', symbols: ['Elses', '__', { literal: 'else' }, '__', { literal: 'if' }, '__', 'Exp', '__', (lexer.has('lcurly') ? { type: 'lcurly' } : lcurly), '__', 'Block', '__', (lexer.has('rcurly') ? { type: 'rcurly' } : rcurly)], postprocess: ([list, _2, _3, _4, _5, _6, exp, _8, _9, _10, block]) => [].concat(list, { type: 'elseif', expression: exp, block } as any) },
    { name: 'Const', symbols: [{ literal: 'const' }, '__', (lexer.has('name') ? { type: 'name' } : name), '_', (lexer.has('assign') ? { type: 'assign' } : assign), '_', 'Exp'], postprocess: ([_1, _2, name, _4, _5, _6, exp]) => ({ type: 'const', name, expression: exp }) },
    { name: 'Let', symbols: [{ literal: 'let' }, '__', (lexer.has('name') ? { type: 'name' } : name), '_', (lexer.has('assign') ? { type: 'assign' } : assign), '_', 'Exp'], postprocess: ([_1, _2, name, _4, _5, _6, exp]) => ({ type: 'let', name, expression: exp }) },
    { name: 'Return', symbols: [{ literal: 'return' }, '__', 'Exp'], postprocess: ([_1, _2, exp]) => ({ type: 'return', expression: exp }) },
    { name: 'Assign', symbols: ['Var', '_', 'AssignOperator', '_', 'Exp'], postprocess: ([name, _2, op, _4, exp]) => ({ type: 'assign', name, expression: exp, op }) },
    { name: 'AssignOperator', symbols: [(lexer.has('assignplus') ? { type: 'assignplus' } : assignplus)], postprocess: id },
    { name: 'AssignOperator', symbols: [(lexer.has('assignminus') ? { type: 'assignminus' } : assignminus)], postprocess: id },
    { name: 'AssignOperator', symbols: [(lexer.has('assign') ? { type: 'assign' } : assign)], postprocess: id },
    { name: 'Exp', symbols: ['ExpOr'], postprocess: id },
    { name: 'ExpOr', symbols: ['ExpOr', '__', (lexer.has('or') ? { type: 'or' } : or), '__', 'ExpAnd'], postprocess: ([left, _1, op, _3, right]) => ({ type: 'or', left, op, right }) },
    { name: 'ExpOr', symbols: ['ExpAnd'], postprocess: id },
    { name: 'ExpAnd', symbols: ['ExpAnd', '__', (lexer.has('and') ? { type: 'and' } : and), '__', 'ExpComparison'], postprocess: ([left, _1, op, _3, right]) => ({ type: 'and', left, op, right }) },
    { name: 'ExpAnd', symbols: ['ExpComparison'], postprocess: id },
    { name: 'ExpComparison', symbols: ['ExpComparison', '_', 'ExpOperator', '_', 'ExpConcatenation'], postprocess: ([left, _1, op, _2, right]) => ({ type: 'compare', left, op, right }) },
    { name: 'ExpComparison', symbols: ['ExpConcatenation'], postprocess: id },
    { name: 'ExpOperator', symbols: [(lexer.has('gt') ? { type: 'gt' } : gt)], postprocess: id },
    { name: 'ExpOperator', symbols: [(lexer.has('gte') ? { type: 'gte' } : gte)], postprocess: id },
    { name: 'ExpOperator', symbols: [(lexer.has('lt') ? { type: 'lt' } : lt)], postprocess: id },
    { name: 'ExpOperator', symbols: [(lexer.has('lte') ? { type: 'lte' } : lte)], postprocess: id },
    { name: 'ExpOperator', symbols: [(lexer.has('eq') ? { type: 'eq' } : eq)], postprocess: id },
    { name: 'ExpOperator', symbols: [(lexer.has('neq') ? { type: 'neq' } : neq)], postprocess: id },
    { name: 'ExpConcatenation', symbols: ['ExpSum', '_', (lexer.has('concat') ? { type: 'concat' } : concat), '_', 'ExpConcatenation'], postprocess: ([left, _1, op, _3, right]) => ({ type: 'concat', left, op, right }) },
    { name: 'ExpConcatenation', symbols: ['ExpSum'], postprocess: id },
    { name: 'ExpSum', symbols: ['ExpSum', '_', 'ExpSumOperator', '_', 'ExpProduct'], postprocess: ([left, _1, op, _3, right]) => ({ type: 'sum', left, op, right }) },
    { name: 'ExpSum', symbols: ['ExpProduct'], postprocess: id },
    { name: 'ExpSumOperator', symbols: [(lexer.has('plus') ? { type: 'plus' } : plus)], postprocess: id },
    { name: 'ExpSumOperator', symbols: [(lexer.has('minus') ? { type: 'minus' } : minus)], postprocess: id },
    { name: 'ExpProduct', symbols: ['ExpProduct', '_', 'ExpProductOperator', '_', 'ExpUnary'], postprocess: ([left, _1, op, _3, right]) => ({ type: 'product', left, op, right }) },
    { name: 'ExpProduct', symbols: ['ExpUnary'], postprocess: id },
    { name: 'ExpProductOperator', symbols: [(lexer.has('times') ? { type: 'times' } : times)], postprocess: id },
    { name: 'ExpProductOperator', symbols: [(lexer.has('divide') ? { type: 'divide' } : divide)], postprocess: id },
    { name: 'ExpProductOperator', symbols: [(lexer.has('percent') ? { type: 'percent' } : percent)], postprocess: id },
    { name: 'ExpUnary', symbols: [(lexer.has('not') ? { type: 'not' } : not), '__', 'ExpPow'], postprocess: ([_1, _2, value]) => ({ type: 'not', value }) },
    { name: 'ExpUnary', symbols: [(lexer.has('bang') ? { type: 'bang' } : bang), 'ExpPow'], postprocess: ([_1, value]) => ({ type: 'not', value }) },
    { name: 'ExpUnary', symbols: [(lexer.has('minus') ? { type: 'minus' } : minus), '_', 'ExpPow'], postprocess: ([_1, _2, value]) => ({ type: 'negate', value }) },
    { name: 'ExpUnary', symbols: ['ExpPow'], postprocess: id },
    { name: 'ExpPow', symbols: ['Atom'], postprocess: id },
    { name: 'ExpPow', symbols: ['Atom', '_', (lexer.has('power') ? { type: 'power' } : power), '_', 'ExpPow'], postprocess: ([left, _1, op, _3, right]) => ({ type: 'power', left, op, right }) },
    { name: 'Atom', symbols: [(lexer.has('string') ? { type: 'string' } : string)], postprocess: id },
    { name: 'Atom', symbols: [(lexer.has('boolean') ? { type: 'boolean' } : boolean)], postprocess: id },
    { name: 'Atom', symbols: [(lexer.has('number') ? { type: 'number' } : number)], postprocess: id },
    { name: 'Atom', symbols: ['Array'], postprocess: id },
    { name: 'Atom', symbols: ['Object'], postprocess: id },
    { name: 'Atom', symbols: ['PrefixExp'], postprocess: id },
    { name: 'Atom', symbols: ['Parenthesized'], postprocess: id },
    { name: 'Parenthesized', symbols: [(lexer.has('lparen') ? { type: 'lparen' } : lparen), '_', 'Exp', '_', (lexer.has('rparen') ? { type: 'rparen' } : rparen)], postprocess: ([_1, _2, exp]) => ({ ...exp, parenthesized: true }) },
    { name: 'ExpName', symbols: [(lexer.has('name') ? { type: 'name' } : name)], postprocess: id },
    { name: 'ExpName', symbols: ['PrefixExp', '_', (lexer.has('lbracket') ? { type: 'lbracket' } : lbracket), '_', 'Exp', '_', (lexer.has('rbracket') ? { type: 'rbracket' } : rbracket)], postprocess: ([prefix, _1, _2, _3, value]) => ({ ...value, prefix, bracket: true }) },
    { name: 'Var', symbols: ['ExpName'], postprocess: id },
    { name: 'Var', symbols: ['PrefixExp', '_', (lexer.has('dot') ? { type: 'dot' } : dot), '_', (lexer.has('name') ? { type: 'name' } : name)], postprocess: ([prefix, _1, _2, _3, value]) => ({ ...value, prefix }) },
    { name: 'PrefixExp', symbols: ['Var'], postprocess: id },
    { name: 'PrefixExp', symbols: ['FunctionCall'], postprocess: id },
    { name: 'PrefixExp', symbols: ['Parenthesized'], postprocess: id },
    { name: 'FunctionCall', symbols: ['PrefixExp', 'Args'], postprocess: ([prefix, args]) => ({ type: 'call', prefix, args }) },
    { name: 'Args', symbols: [(lexer.has('lparen') ? { type: 'lparen' } : lparen), '_', (lexer.has('rparen') ? { type: 'rparen' } : rparen)], postprocess: () => [] },
    { name: 'Args', symbols: [(lexer.has('lparen') ? { type: 'lparen' } : lparen), '_', 'ExpList', '_', (lexer.has('rparen') ? { type: 'rparen' } : rparen)], postprocess: ([_1, _2, args]) => args },
    { name: 'Array', symbols: [(lexer.has('lbracket') ? { type: 'lbracket' } : lbracket), '_', (lexer.has('rbracket') ? { type: 'rbracket' } : rbracket)], postprocess: () => ({ type: 'array', value: [] }) },
    { name: 'Array', symbols: [(lexer.has('lbracket') ? { type: 'lbracket' } : lbracket), '_', 'ExpList', '_', (lexer.has('rbracket') ? { type: 'rbracket' } : rbracket)], postprocess: ([_1, _2, value]) => ({ type: 'array', value }) },
    { name: 'Object', symbols: [(lexer.has('lcurly') ? { type: 'lcurly' } : lcurly), '_', (lexer.has('rcurly') ? { type: 'rcurly' } : rcurly)], postprocess: () => ({ type: 'object', value: [] }) },
    { name: 'Object', symbols: [(lexer.has('lcurly') ? { type: 'lcurly' } : lcurly), '_', 'KeyValueList', '_', (lexer.has('rcurly') ? { type: 'rcurly' } : rcurly)], postprocess: ([_1, _2, value]) => ({ type: 'object', value }) },
    { name: 'ExpList', symbols: ['Exp'] },
    { name: 'ExpList', symbols: ['ExpList', '_', (lexer.has('comma') ? { type: 'comma' } : comma), '_', 'Exp'], postprocess: ([list, _1, _2, _3, exp]) => [].concat(list, exp) },
    { name: 'KeyValuePair', symbols: ['ExpName', '_', (lexer.has('colon') ? { type: 'colon' } : colon), '_', 'Exp'], postprocess: ([key, _1, _2, _3, value]) => ({ key, value }) },
    { name: 'KeyValuePair', symbols: [(lexer.has('string') ? { type: 'string' } : string), '_', (lexer.has('colon') ? { type: 'colon' } : colon), '_', 'Exp'], postprocess: ([key, _1, _2, _3, value]) => ({ key: { ...key, type: 'name' }, value }) },
    { name: 'KeyValuePair', symbols: ['ExpName'], postprocess: ([key]) => ({ key, value: key }) },
    { name: 'KeyValueList', symbols: ['KeyValuePair'] },
    { name: 'KeyValueList', symbols: ['KeyValueList', '_', (lexer.has('comma') ? { type: 'comma' } : comma), '_', 'KeyValuePair'], postprocess: ([list, _1, _2, _3, exp]) => [].concat(list, exp) },
    { name: '_', symbols: [] },
    { name: '_', symbols: ['_', (lexer.has('ws') ? { type: 'ws' } : ws)], postprocess: () => null },
    { name: '__', symbols: [(lexer.has('ws') ? { type: 'ws' } : ws)], postprocess: () => null },
    { name: '__', symbols: ['__', (lexer.has('ws') ? { type: 'ws' } : ws)], postprocess: () => null },
  ],
  ParserStart: 'Root',
}

export default grammar
