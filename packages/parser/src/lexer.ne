@{%
const moo = require("moo")

const lexer = moo.compile({
  // nl: { match: /\n/, lineBreaks: true },
  ws: { match: /[ \t\n]+/, lineBreaks: true },
  // ws: /[ \t]+/,
  boolean: /true|false/,
  and: '&&',
  or:  /or|\|\|/,
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
  string: { match: /"(?:\\["\\]|[^\n"\\])*"|'(?:\\['\\]|[^\n'\\])*'/, value: s => s.slice(1, -1).replace(/\\"/g, '"') },
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
%}

# Pass your lexer object using the @lexer option:
@lexer lexer

# Root
Root -> _ RootBlock _ {% ([_, root]) => root %}

RootBlock -> RootStatement
  | RootBlock _ %semi _ RootStatement {% ([list, _2, _3, _4, exp]) => [].concat(list, exp) %}
  | RootBlock __ RootStatement {% ([list, _2, exp]) => [].concat(list, exp) %}

RootStatement -> 
  Collection {% id %} 
  | Function {% id %} 


# Collection
Collection -> "collection" __ %name _ %lcurly _ CollectionBlockList _ %rcurly {% ([_1, _2, name, _4, _5, _6, fields]) => ({ type: "collection", name, fields }) %}
CollectionBlockList -> CollectionBlock 
  | CollectionBlockList __ CollectionBlock {% ([list, _2, exp]) => [].concat(list, exp) %}
  | CollectionBlockList _ %semi _ CollectionBlock {% ([list, _2, _3, _4, exp]) => [].concat(list, exp) %}
CollectionBlock -> CollectionKeyValuePair  {% id %} 
  | Function  {% id %} 
CollectionKeyValuePair -> %name _ %colon _ %name {% ([name, _2, _3, _4, kind]) => ({ type: "field", name, kind }) %}
  | %name _ %colon _ %name  %bang {% ([name, _2, _3, _4, kind]) => ({ type: "field", name, kind, required: true }) %}
  | %name __ %name {% ([name, _2, kind]) => ({ type: "field", name, kind }) %}
  | %name __ %name %bang {% ([name, _2, kind]) => ({ type: "field", name, kind, required: true }) %}


# Function
Function -> "function" __ %name _ FunctionParams _ FunctionBody {% ([_1, _2, name, _4, params, _6, body]) => ({ type: "function", name, params, body }) %}
FunctionBody -> %lcurly __ Block __ %rcurly  {% ([_1, _2, block]) => block %}
FunctionParams -> %lparen _ FunctionParamsList _ %rparen {% ([_1, params]) => params %}
  | %lparen _ %rparen {% () => [] %}
FunctionParamsList -> %name
	| FunctionParamsList _ %comma _ %name


## Block
Block -> Statement
	| Block _ %semi _ Statement {% ([list, _2, _3, _4, exp]) => [].concat(list, exp) %}
	| Block __ Statement {% ([list, _2, exp]) => [].concat(list, exp) %}

Statement ->
  If {% id %}
  | Const {% id %}
  | Let {% id %}
  | Return {% id %}
  | Assign {% id %}


## If
If -> "if" __ Exp __ %lcurly __ Block __ Elses {% ([_1, _2, exp, _4, _5, _6, block, _8, elses]) => ({ type: "if", expression: exp, block, elses }) %}

Elses -> %rcurly {% () => []  %}
  | "else" %lcurly __ Block __ %rcurly {% ([_1, _2, _3, block]) => ({ type: "else", expression: null, block }) %}
  | "else" __ "if" __ Exp __ %lcurly __ Block __ %rcurly {% ([_1, _2, _3, _4, exp, _6, block]) => ({ type: "elseif", expression: exp, block }) %}
	| Elses __ "else" __ %lcurly __ Block __ %rcurly {% ([list, _2, _3, _4, _5, _6, block]) => [].concat(list, { type: "else", expression: null, block  }) %}
  | Elses __ "else" __ "if" __ Exp __ %lcurly __ Block __ %rcurly {% ([list, _2, _3, _4, _5, _6, exp, _8, _9, _10, block]) => [].concat(list, { type: "elseif", expression: exp, block  }) %}


## Assignment
Const -> "const" __ %name _ %assign _ Exp {% ([_1, _2, name, _4, _5, _6, exp]) => ({ type: "const", name, expression: exp }) %}
Let -> "let" __ %name _ %assign _ Exp {% ([_1, _2, name, _4, _5, _6, exp]) => ({ type: "let", name, expression: exp }) %}
Return -> "return" __ Exp {% ([_1, _2, exp]) => ({ type: "return", expression: exp }) %}
Assign ->  Var _ AssignOperator _ Exp {% ([name, _2, op, _4, exp]) => ({ type: "assign", name, expression: exp, op }) %}
AssignOperator -> 
   %assignplus {% id %}
   | %assignminus {% id %}
   | %assign {% id %}


## Expressions
Exp -> ExpOr {% id %}

ExpOr ->
	ExpOr __ %or  __ ExpAnd {% ([left, _1, op, _3, right]) => ({ type: "or", left, op, right }) %}
	| ExpAnd {% id %}

ExpAnd -> ExpAnd __ %and __ ExpComparison {% ([left, _1, op, _3, right]) => ({ type: "and", left, op, right }) %}
	| ExpComparison {% id %}

ExpComparison -> ExpComparison _ ExpOperator _ ExpConcatenation {% ([left, _1, op, _2, right]) => ({ type: "compare", left, op, right }) %}
  | ExpConcatenation {% id %}

ExpOperator ->
  %gt     {% id %}
  | %gte  {% id %}
  | %lt   {% id %}
  | %lte  {% id %}
  | %eq   {% id %}
  | %neq  {% id %}

ExpConcatenation ->
	  ExpSum _ %concat _ ExpConcatenation {% ([left, _1, op, _3, right]) => ({ type: "concat", left, op, right }) %}
	| ExpSum {% id %}

ExpSum ->
	  ExpSum _ ExpSumOperator _ ExpProduct {% ([left, _1, op, _3, right]) => ({ type: "sum", left, op, right }) %}
	| ExpProduct {% id %}

ExpSumOperator -> 
  %plus     {% id %}
  | %minus  {% id %}
 
ExpProduct ->
	  ExpProduct _ ExpProductOperator _ ExpUnary {% ([left, _1, op, _3, right]) => ({ type: "product", left, op, right }) %}
	| ExpUnary {% id %}

ExpProductOperator -> 
  %times     {% id %}
  | %divide  {% id %}
  | %percent  {% id %}
 
ExpUnary ->
	  %not __ ExpPow {% ([_1, _2, value]) => ({ type: "not", value }) %}
	| %bang ExpPow {% ([_1, value]) => ({ type: "not", value }) %}
	| %minus _ ExpPow {% ([_1, _2, value]) => ({ type: "negate", value }) %}
	| ExpPow {% id %}
 
ExpPow ->
	  Atom {% id %}
	| Atom _ %power _ ExpPow {% ([left, _1, op, _3, right]) => ({ type: "power", left, op, right }) %}

Atom ->
  %string   {% id %}
  | %boolean {% id %}
  | %number {% id %}
  | Array {% id %}
  | Object {% id %}
  | PrefixExp   {% id %}
  | Parenthesized {% id %}

Parenthesized -> %lparen _ Exp _ %rparen {% ([_1, _2, exp]) => ({ ...exp, parenthesized: true }) %}


# Function Calls
ExpName -> %name {% id %}
  | PrefixExp _ %lbracket _ Exp _ %rbracket {% ([prefix, _1, _2, _3, value]) => ({ ...value, prefix, bracket: true }) %}

Var -> ExpName {% id %}
	| PrefixExp _ %dot _ %name {% ([prefix, _1, _2, _3, value]) => ({ ...value, prefix }) %}
 
PrefixExp -> Var {% id %}
	| FunctionCall {% id %}
	| Parenthesized {% id %}
 
FunctionCall -> PrefixExp Args {% ([prefix, args]) => ({ type: "call", prefix, args }) %}
 
Args ->
	%lparen _ %rparen {% () => [] %}
	| %lparen _ ExpList _ %rparen {% ([_1, _2, args]) => args %}


## Array, Object
Array -> %lbracket _ %rbracket {% () => ({ type: "array", value: [] }) %}
	| %lbracket _ ExpList _ %rbracket {% ([_1, _2, value]) => ({ type: "array", value }) %}

Object -> %lcurly _ %rcurly {% () => ({ type: "object", value: [] }) %}
  | %lcurly _ KeyValueList _ %rcurly {% ([_1, _2, value]) => ({ type: "object", value }) %}

ExpList -> Exp
	| ExpList _ %comma _ Exp {% ([list, _1, _2, _3, exp]) => [].concat(list, exp) %}

KeyValuePair -> ExpName _ %colon _ Exp {% ([key, _1, _2, _3, value]) => ({ key, value }) %}
  | %string _ %colon _ Exp {% ([key, _1, _2, _3, value]) => ({ key: { ...key, type: "name" }, value }) %}
  | ExpName {% ([key]) => ({ key, value: key }) %}

# abc: xyz, jkl: 123
KeyValueList -> KeyValuePair
  | KeyValueList _ %comma _ KeyValuePair {% ([list, _1, _2, _3, exp]) => [].concat(list, exp) %}


# Whitespace
_ -> null | _ %ws {% () => null %}
__ -> %ws {% () => null %} | __ %ws {% () => null %}