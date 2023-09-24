import {
  Token,
  alt_sc,
  opt,
  kright,
  list_sc,
  ParseError,
} from "typescript-parsec";
import * as E from "fp-ts/Either";

import {
  buildLexer,
  expectEOF,
  expectSingleResult,
  rule,
} from "typescript-parsec";
import { alt, apply, kmid, lrec_sc, seq, str, tok } from "typescript-parsec";

import {
  Value,
  Expression,
  Environment,
  Identifier,
  BinaryOp,
  Statement,
  OutputLine,
  UnaryOp,
  n,
  l,
  t,
  va,
} from "./ast";

//Lexer
enum TokenKind {
  String,
  Number,
  Add,
  Sub,
  Mul,
  Div,
  DivDiv,
  LParen,
  RParen,
  Space,
  ConditionalStart,
  ConditionalEnd,
  Identifier,
  ComputedIdentifierStart,
  ComputedIdentifierEnd,
  Bind,
  Print,
  Emit,
  Comma,
  LBracket,
  RBracket,
  SemiColon,
  Func,
  If,
  Then,
  Else,
  Not,
  NewLine,
  ProcDef,
  ProcRun,
  Rnd,
  Equal,
  Greater,
  LessThan,
}

const lexer = buildLexer([
  [true, /^".*?"/g, TokenKind.String],
  [true, /^PRINT/g, TokenKind.Print],
  [true, /^EMIT/g, TokenKind.Emit],
  [true, /^FUNC/g, TokenKind.Func],
  [true, /^IF/g, TokenKind.If],
  [true, /^THEN/g, TokenKind.Then],
  [true, /^ELSE/g, TokenKind.Else],
  [true, /^PROC/g, TokenKind.ProcDef],
  [true, /^RUN/g, TokenKind.ProcRun],
  [true, /^RND/g, TokenKind.Rnd],
  [true, /^[a-z_][A-Za-z_0-9]*/g, TokenKind.Identifier],
  [true, /^\$\[/g, TokenKind.ComputedIdentifierStart],
  [true, /^\]/g, TokenKind.ComputedIdentifierEnd],
  [true, /^\d+(\.\d+)?/g, TokenKind.Number],
  [true, /^\!/g, TokenKind.Not],
  [true, /^\+/g, TokenKind.Add],
  [true, /^\-/g, TokenKind.Sub],
  [true, /^\*/g, TokenKind.Mul],
  [true, /^\/\//g, TokenKind.Div],
  [true, /^\//g, TokenKind.Div],
  [true, /^\(/g, TokenKind.LParen],
  [true, /^\)/g, TokenKind.RParen],
  [true, /^\?/g, TokenKind.ConditionalStart],
  [true, /^\:/g, TokenKind.ConditionalEnd],
  [true, /^==/g, TokenKind.Equal],
  [true, /^>/g, TokenKind.Greater],
  [true, /^</g, TokenKind.LessThan],

  [true, /^\=/g, TokenKind.Bind],
  [false, /^\s+/g, TokenKind.Space],
  [true, /^,/g, TokenKind.Comma],
  [true, /^;/g, TokenKind.SemiColon],
  [true, /^\{/g, TokenKind.LBracket],
  [true, /^\}/g, TokenKind.RBracket],
]);

// Parser

const IDENTIFIER = rule<TokenKind, Identifier>();
const TERM = rule<TokenKind, Expression>();
const FACTOR_EXP = rule<TokenKind, Expression>();
const BINARY_EXP = rule<TokenKind, Expression>();
const COMPARISON_EXP = rule<TokenKind, Expression>();
const CONDITIONAL_EXP = rule<TokenKind, Expression>();
const STMT = rule<TokenKind, Statement>();

IDENTIFIER.setPattern(
  alt_sc(
    apply(tok(TokenKind.Identifier), (value: Token<TokenKind.Identifier>) => ({
      type: "literal",
      value: value.text,
    })),
    apply(
      kmid(
        tok(TokenKind.ComputedIdentifierStart),
        CONDITIONAL_EXP,
        tok(TokenKind.ComputedIdentifierEnd)
      ),
      (value: Expression) => ({ type: "computed", value: value })
    )
  )
);

/*
  TERM
    = NUMBER
    = STRING
    = FUNC
    = FUNC call
    = VAR
    = ('+' | '-' | '!') TERM
    = '(' EXP ')'
  */
TERM.setPattern(
  alt_sc(
    // NUMBER literal
    apply(
      tok(TokenKind.Number),
      (value: Token<TokenKind.Number>): Expression => l(n(+value.text))
    ),
    // STRING
    apply(
      tok(TokenKind.String),
      (value: Token<TokenKind.String>): Expression =>
        l(t(value.text.substring(1, value.text.length - 1)))
    ),
    // FUNC literal
    apply(
      seq(tok(TokenKind.Func), CONDITIONAL_EXP),

      ([t1, value]: [Token<TokenKind.Func>, Expression]): Expression =>
        l({ type: "func", value })
    ),

    // FUNC call
    apply(
      seq(
        IDENTIFIER,
        tok(TokenKind.LParen),
        opt(list_sc(CONDITIONAL_EXP, str(","))),
        tok(TokenKind.RParen)
      ),
      ([identifier, a, args]: [
        Identifier,
        any,
        Expression[] | undefined,
        any
      ]): Expression => ({
        type: "fun_call",
        identifier,
        args: args || [],
      })
    ),
    // VAR resolution
    apply(IDENTIFIER, (identifier: Identifier) => ({
      type: "var",
      identifier,
    })),

    // UNARY
    apply(
      seq(alt(str("+"), str("-"), str("!")), TERM),
      ([opToken, expression]: [Token<TokenKind>, Expression]): Expression => {
        if (opToken.text == "+" || opToken.text == "-" || opToken.text == "!")
          return {
            type: "unary_op",
            op: opToken.text,
            x: expression,
          };
        else throw new Error(`Invalid unary op ${opToken.text}`);
      }
    ),

    // Parens
    apply(kmid(str("("), CONDITIONAL_EXP, str(")")), (value: Expression) => ({
      type: "parens",
      expression: value,
    }))
  )
);

/*
  FACTOR_EXP
    = TERM ('*' | '/') TERM
  */
FACTOR_EXP.setPattern(
  lrec_sc(TERM, seq(alt(str("*"), str("//"), str("/")), TERM), applyBinary)
);
/*
  BINARY_EXP
    = FACTOR_EXP ('+' | '-' ) FACTOR_EXP
  */
BINARY_EXP.setPattern(
  lrec_sc(FACTOR_EXP, seq(alt(str("+"), str("-")), FACTOR_EXP), applyBinary)
);

COMPARISON_EXP.setPattern(
  lrec_sc(
    BINARY_EXP,
    seq(alt(str("=="), str(">"), str("<")), BINARY_EXP),
    applyBinary
  )
);
/*
  CONDITIONAL_EXP
    = BINARY_EXP ? BINARY_EXP : BINARY_EXP
  */

CONDITIONAL_EXP.setPattern(
  alt_sc(
    apply(
      seq(
        COMPARISON_EXP,
        tok(TokenKind.ConditionalStart),
        COMPARISON_EXP,
        tok(TokenKind.ConditionalEnd),
        CONDITIONAL_EXP
      ),
      ([first, t1, onTrue, t2, onFalse]: [
        Expression,
        Token<TokenKind.ConditionalStart>,
        Expression,
        Token<TokenKind.ConditionalEnd>,
        Expression
      ]): Expression => ({
        type: "conditon",
        condition: first,
        onTrue,
        onFalse,
      })
    ),
    apply(
      seq(
        COMPARISON_EXP,
        tok(TokenKind.ConditionalStart),
        CONDITIONAL_EXP,
        tok(TokenKind.ConditionalEnd),
        CONDITIONAL_EXP
      ),
      ([first, t1, onTrue, t2, onFalse]: [
        Expression,
        Token<TokenKind.ConditionalStart>,
        Expression,
        Token<TokenKind.ConditionalEnd>,
        Expression
      ]): Expression => ({
        type: "conditon",
        condition: first,
        onTrue,
        onFalse,
      })
    ),

    COMPARISON_EXP
  )
);

STMT.setPattern(
  alt(
    apply(
      seq(IDENTIFIER, tok(TokenKind.Bind), CONDITIONAL_EXP),
      (second: [Identifier, Token<TokenKind.Bind>, Expression]): Statement => ({
        type: "bind",
        identifier: second[0],
        value: second[2],
      })
    ),

    apply(
      seq(tok(TokenKind.Print), CONDITIONAL_EXP),
      ([t1, value]: [Token<TokenKind.Print>, Expression]): Statement => {
        return { type: "print", value };
      }
    ),
    apply(
      seq(tok(TokenKind.Emit), CONDITIONAL_EXP),
      ([t1, value]: [Token<TokenKind.Emit>, Expression]): Statement => {
        return { type: "emit", value };
      }
    ),
    apply(
      kmid(
        tok(TokenKind.LBracket),
        list_sc(STMT, str(";")),
        seq(opt(str(";")), tok(TokenKind.RBracket))
      ),
      (statements: Statement[]): Statement => ({ type: "block", statements })
    ),
    apply(
      seq(tok(TokenKind.ProcDef), IDENTIFIER, STMT),
      ([t1, identifier, statement]: [
        Token<TokenKind.ProcDef>,
        Identifier,
        Statement
      ]): Statement => {
        return {
          type: "proc_def",
          statement,
          identifier,
        };
      }
    ),

    apply(
      seq(
        tok(TokenKind.ProcRun),
        IDENTIFIER,
        tok(TokenKind.LParen),
        opt(list_sc(CONDITIONAL_EXP, str(","))),
        tok(TokenKind.RParen)
      ),
      ([t1, identifier, lp, args, rp]: [
        Token<TokenKind.ProcRun>,
        Identifier,
        any,
        Expression[] | undefined,
        any
      ]): Statement => ({
        type: "proc_run",
        identifier,
        args: args || [],
      })
    ),

    apply(
      seq(tok(TokenKind.Rnd), IDENTIFIER, CONDITIONAL_EXP, CONDITIONAL_EXP),
      ([t1, identifier, from, to]: [
        Token<TokenKind.Rnd>,
        Identifier,
        Expression,
        Expression
      ]): Statement => ({
        type: "random",
        identifier,
        from,
        to,
      })
    ),

    apply(
      seq(
        tok(TokenKind.If),
        CONDITIONAL_EXP,
        tok(TokenKind.Then),
        STMT,
        opt(kright(tok(TokenKind.Else), STMT))
      ),
      ([a, expr, b, thenStmt, elseStmt]) => ({
        type: "if",
        condition: expr,
        thenStatement: thenStmt,
        elseStatement: elseStmt,
      })
    )
  )
);

function applyBinary(
  first: Expression,
  second: [Token<TokenKind>, Expression]
): Expression {
  switch (second[0].text) {
    case "+":
      return { type: "binary_op", op: "+", x: first, y: second[1] };
    case "-":
      return { type: "binary_op", op: "-", x: first, y: second[1] };
    case "*":
      return { type: "binary_op", op: "*", x: first, y: second[1] };
    case "/":
      return { type: "binary_op", op: "/", x: first, y: second[1] };
    case "//":
      return { type: "binary_op", op: "//", x: first, y: second[1] };
    case "==":
      return { type: "binary_op", op: "==", x: first, y: second[1] };
    case "<":
      return { type: "binary_op", op: "<", x: first, y: second[1] };
    case ">":
      return { type: "binary_op", op: ">", x: first, y: second[1] };
  }
  throw new Error(`Unknown binary operator: ${second[0].text}`);
}

// PARSING

//can throw errors
export function parseExpression(expr: string): Expression {
  return E.match(
    (e: ParseError) => {
      throw new Error(e.message);
    },
    (v: Expression) => v
  )(parseExpressionSafely(expr));
}

//can throw errors
export function parseStatement(expr: string): Statement {
  return E.match(
    (e: ParseError) => {
      throw new Error(e.message);
    },
    (s: Statement) => s
  )(parseStatementSafely(expr));
}

export function parseExpressionSafely(
  expr: string
): E.Either<ParseError, Expression> {
  const result = expectEOF(CONDITIONAL_EXP.parse(lexer.parse(expr)));
  if (result.successful) return E.right(expectSingleResult(result));
  else return E.left(result.error);
}

export function parseStatementSafely(
  expr: string
): E.Either<ParseError, Statement> {
  const result = expectEOF(STMT.parse(lexer.parse(expr)));
  if (result.successful) return E.right(expectSingleResult(result));
  else return E.left(result.error);
}
