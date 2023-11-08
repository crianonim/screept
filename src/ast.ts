// AST
import { match } from "ts-pattern";
import { pipe, flow } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as A from "fp-ts/Array";
import { z } from "zod";

const schemaValueNumber = z.object({
  type: z.literal("number"),
  value: z.number().nonnegative(),
});

const schemaValueText = z.object({
  type: z.literal("text"),
  value: z.string(),
});

//todo
const schemaValueFuncBase = z.object({
  type: z.literal("func"),
});
type ValueFunc = z.infer<typeof schemaValueFuncBase> & { value: Expression };
const schemaValueFunc: z.ZodType<ValueFunc> = schemaValueFuncBase.extend({
  value: z.lazy(() => schemaExpression),
});
export const schemaValue = z.union([
  schemaValueNumber,
  schemaValueText,
  schemaValueFunc,
]);

export type Value = z.infer<typeof schemaValue>;

// Identifier
const schemaIndentifierLiteral = z.object({
  type: z.literal("literal"),
  value: z.string(),
});
const schemaIndentifierComputedBase = z.object({
  type: z.literal("computed"),
});
type IndentifierComputed = z.infer<typeof schemaIndentifierComputedBase> & {
  value: Expression;
};
const schemaIndentifierComputed: z.ZodType<IndentifierComputed> =
  schemaIndentifierComputedBase.extend({
    value: z.lazy(() => schemaExpression),
  });

export const schemaIdentifier = z.union([
  schemaIndentifierLiteral,
  schemaIndentifierComputed,
]);

export type Identifier = z.infer<typeof schemaIdentifier>;

// Expression Literal
const schemaExpressionLiteral = z.object({
  type: z.literal("literal"),
  value: schemaValue,
});

const schemaUnaryOp = z.union([z.literal("+"), z.literal("-"), z.literal("!")]);
export type UnaryOp = z.infer<typeof schemaUnaryOp>;

type ExpressionUnary = z.infer<typeof schemaExpressionUnaryBase> & {
  x: Expression;
};
const schemaExpressionUnaryBase = z.object({
  type: z.literal("unary_op"),
  op: schemaUnaryOp,
});

const schemaExpressionUnary: z.ZodType<ExpressionUnary> =
  schemaExpressionUnaryBase.extend({
    x: z.lazy(() => schemaExpression),
  });

const schemaBinaryOp = z.union([
  z.literal("+"),
  z.literal("-"),
  z.literal("*"),
  z.literal("/"),
  z.literal("//"),
  z.literal("=="),
  z.literal("<"),
  z.literal(">"),
]);
export type BinaryOp = z.infer<typeof schemaBinaryOp>;

const schemaExpressionBinaryBase = z.object({
  type: z.literal("binary_op"),
  op: schemaBinaryOp,
});

type ExpressionBinary = z.infer<typeof schemaExpressionBinaryBase> & {
  x: Expression;
  y: Expression;
};
const schemaExpressionBinary: z.ZodType<ExpressionBinary> =
  schemaExpressionBinaryBase.extend({
    x: z.lazy(() => schemaExpression),
    y: z.lazy(() => schemaExpression),
  });

const schemaExpressionVarBase = z.object({ type: z.literal("var") });
type ExpressionVar = z.infer<typeof schemaExpressionVarBase> & {
  identifier: Identifier;
};
const schemaExpressionVar: z.ZodType<ExpressionVar> =
  schemaExpressionVarBase.extend({
    identifier: z.lazy(() => schemaIdentifier),
  });

const schemaExpressionConditionalBase = z.object({
  type: z.literal("condition"),
});
type ExpressionCondition = z.infer<typeof schemaExpressionConditionalBase> & {
  condition: Expression;
  onTrue: Expression;
  onFalse: Expression;
};
const schemaExpressionConditional: z.ZodType<ExpressionCondition> =
  schemaExpressionConditionalBase.extend({
    condition: z.lazy(() => schemaExpression),
    onTrue: z.lazy(() => schemaExpression),
    onFalse: z.lazy(() => schemaExpression),
  });

const schemaExpressionFunCallBase = z.object({
  type: z.literal("fun_call"),
});
type ExpressionFunCall = z.infer<typeof schemaExpressionFunCallBase> & {
  identifier: Identifier;
  args: Expression[];
};
const schemaExpressionFunCall: z.ZodType<ExpressionFunCall> =
  schemaExpressionFunCallBase.extend({
    identifier: z.lazy(() => schemaIdentifier),
    args: z.array(z.lazy(() => schemaExpression)),
  });

const schemaExpressionParensBase = z.object({
  type: z.literal("parens"),
});

type ExpressionParens = z.infer<typeof schemaExpressionParensBase> & {
  expression: Expression;
};

const schemaExpressionParens: z.ZodType<ExpressionParens> =
  schemaExpressionParensBase.extend({
    expression: z.lazy(() => schemaExpression),
  });
export const schemaExpression = z.union([
  schemaExpressionLiteral,
  schemaExpressionUnary,
  schemaExpressionBinary,
  schemaExpressionVar,
  schemaExpressionConditional,
  schemaExpressionFunCall,
  schemaExpressionParens,
]);

export type Expression = z.infer<typeof schemaExpression>;

const schemaStatementBind = z.object({
  type: z.literal("bind"),
  identifier: schemaIdentifier,
  value: schemaExpression,
});

const schemaStatementPrint = z.object({
  type: z.literal("print"),
  value: schemaExpression,
});

const schemaStatementEmit = z.object({
  type: z.literal("emit"),
  value: schemaExpression,
});

const schemaStatementProcDefBase = z.object({
  type: z.literal("proc_def"),
  identifier: schemaIdentifier,
});
type StatementProcDef = z.infer<typeof schemaStatementProcDefBase> & {
  statement: Statement;
};
const schemaStatementProcDef: z.ZodType<StatementProcDef> =
  schemaStatementProcDefBase.extend({
    statement: z.lazy(() => schemaStatement),
  });

const schemaStatementBlockBase = z.object({
  type: z.literal("block"),
});
type StatementBlock = z.infer<typeof schemaStatementBlockBase> & {
  statements: Statement[];
};
const schemaStatementBlock: z.ZodType<StatementBlock> =
  schemaStatementBlockBase.extend({
    statements: z.array(z.lazy(() => schemaStatement)),
  });

const schemaStatementProcRun = z.object({
  type: z.literal("proc_run"),
  identifier: schemaIdentifier,
  args: z.array(schemaExpression),
});

const schemaStatementRandom = z.object({
  type: z.literal("random"),
  identifier: schemaIdentifier,
  from: schemaExpression,
  to: schemaExpression,
});

const schemaStatementIfBase = z.object({
  type: z.literal("if"),
  condition: schemaExpression,
});
type StatementIf = z.infer<typeof schemaStatementIfBase> & {
  thenStatement: Statement;
  elseStatement?: Statement;
};
const schemaStatementIf: z.ZodType<StatementIf> = schemaStatementIfBase.extend({
  thenStatement: z.lazy(() => schemaStatement),
  elseStatement: z.lazy(() => schemaStatement).optional(),
});

export const schemaStatement = z.union([
  schemaStatementBind,
  schemaStatementPrint,
  schemaStatementEmit,
  schemaStatementProcDef,
  schemaStatementProcRun,
  schemaStatementRandom,
  schemaStatementBlock,
  schemaStatementIf,
]);
export type Statement = z.infer<typeof schemaStatement>;

const schemaOutputLine = z.object({
  ts: z.number().positive(),
  value: z.string(),
});
export type OutputLine = z.infer<typeof schemaOutputLine>;
export const schemaEnvironment = z.object({
  vars: z.record(schemaValue),
  procedures: z.record(schemaStatement),
  output: z.array(schemaOutputLine),
});

export type Environment = z.infer<typeof schemaEnvironment>;

type EvaluationErrorType =
  | "type error - number expected"
  | "undefined"
  | "other evaluation error";

type EvaluationError = { type: EvaluationErrorType; ctx: string };

export function evaluateIdentifier(environment: Environment, id: Identifier) {
  if (id.type == "literal") return id.value;
  else {
    return getStringValue(evaluateExpression(environment, id.value));
  }
}

export function evaluateIdentifierSafely(
  environment: Environment,
  id: Identifier
): E.Either<EvaluationError, string> {
  if (id.type == "literal") return E.right(id.value);
  else {
    return pipe(
      evaluateExpressionSafely(environment, id.value),
      E.map(getStringValue)
    );
  }
}

export function evaluateExpression(
  environment: Environment,
  expression: Expression
): Value {
  return E.match(
    (e: EvaluationError) => {
      throw new Error(evaluationErrorToString(e));
    },
    (v: Value) => v
  )(evaluateExpressionSafely(environment, expression));
}
export function evaluateExpressionSafelyCurried(environment: Environment) {
  return (expression: Expression) =>
    evaluateExpressionSafely(environment, expression);
}

export function evaluateExpressionSafely(
  environment: Environment,
  expression: Expression
): E.Either<EvaluationError, Value> {
  return match(expression)
    .with(
      { type: "literal" },
      ({ value }): E.Either<EvaluationError, Value> => E.of(value)
    )
    .with(
      { type: "binary_op" },
      ({ x, y, op }): E.Either<EvaluationError, Value> => {
        const evX = evaluateExpressionSafely(environment, x);
        const evY = evaluateExpressionSafely(environment, y);
        return pipe(
          E.of(
            (e1: Value) => (e2: Value) =>
              evaluateBinaryExpressionSafely(op, e1, e2)
          ),
          E.ap(evX),
          E.ap(evY),
          E.flatten
        );
      }
    )
    .with(
      { type: "var" },
      ({ identifier }): E.Either<EvaluationError, Value> =>
        pipe(
          evaluateIdentifierSafely(environment, identifier),
          E.chain((id) =>
            !environment.vars[id]
              ? E.left({ type: "undefined", ctx: id })
              : E.right(environment.vars[id])
          )
        )
    )
    .with(
      { type: "unary_op" },
      ({ op, x }): E.Either<EvaluationError, Value> =>
        match(op)
          .with("-", () =>
            pipe(
              evaluateExpressionSafely(environment, x),
              E.chain((v: Value) =>
                match(v)
                  .with({ type: "number" }, ({ value }) => E.right(n(-value)))
                  .otherwise(() => {
                    return E.left(evalError("type-number"));
                  })
              )
            )
          )

          .with("+", () =>
            pipe(
              evaluateExpressionSafely(environment, x),
              E.chain((v: Value) =>
                match(v)
                  .with({ type: "number" }, ({ value }) => E.right(n(+value)))
                  .otherwise(() => {
                    return E.left(evalError("type-number"));
                  })
              )
            )
          )
          .with("!", () =>
            pipe(
              evaluateExpressionSafely(environment, x),
              E.map((x) => (isTruthy(x) ? n(0) : n(1)))
            )
          )
          .exhaustive()
    )
    .with(
      { type: "condition" },
      ({ condition, onTrue, onFalse }): E.Either<EvaluationError, Value> =>
        pipe(
          evaluateExpressionSafely(environment, condition),
          E.chain((x) =>
            isTruthy(x)
              ? evaluateExpressionSafely(environment, onTrue)
              : evaluateExpressionSafely(environment, onFalse)
          )
        )
    )

    .with(
      { type: "fun_call" },
      ({ args, identifier }): E.Either<EvaluationError, Value> => {
        const funcExpression: E.Either<EvaluationError, Expression> = pipe(
          evaluateIdentifierSafely(environment, identifier),
          E.chain((id) =>
            environment.vars[id] && environment.vars[id].type === "func"
              ? E.right(environment.vars[id].value as Expression)
              : E.left({ type: "undefined", ctx: id })
          )
        );

        return pipe(
          E.of(evaluateExpressionSafelyCurried),
          E.ap(environmentWithArgs(args, environment)),
          E.ap(funcExpression),
          E.flatten
        );
      }
    )
    .with({ type: "parens" }, ({ expression }) =>
      evaluateExpressionSafely(environment, expression)
    )
    .exhaustive();
}

function evaluateBinaryExpressionSafely(
  op: BinaryOp,
  x: Value,
  y: Value
): E.Either<EvaluationError, Value> {
  return match(op)
    .with("+", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          E.right(n(xx.value + yy.value))
        )
        .otherwise(() => E.right(t(getStringValue(x) + getStringValue(y))))
    )
    .with("-", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          E.right(n(xx.value - yy.value))
        )
        .otherwise(() => E.left(evalError("type error - number expected")))
    )
    .with("*", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          E.right(n(xx.value * yy.value))
        )
        .otherwise(() => E.left(evalError("type error - number expected")))
    )
    .with("/", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          E.right(n(xx.value / yy.value))
        )
        .otherwise(() => E.left(evalError("type error - number expected")))
    )
    .with("//", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          E.right(n(Math.floor(xx.value / yy.value)))
        )
        .otherwise(() => E.left(evalError("type error - number expected")))
    )
    .with("==", () =>
      E.right(
        x.type === y.type && getStringValue(x) === getStringValue(y)
          ? n(1)
          : n(0)
      )
    )
    .with("<", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          E.right(xx.value < yy.value ? n(1) : n(0))
        )
        .otherwise(() => E.left(evalError("type error - number expected")))
    )
    .with(">", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          E.right(xx.value > yy.value ? n(1) : n(0))
        )
        .otherwise(() => E.left(evalError("type error - number expected")))
    )
    .exhaustive();
}
export function getStringValue(v: Value): string {
  return match(v)
    .with({ type: "number" }, ({ value }) => String(value))
    .with({ type: "text" }, ({ value }) => value)
    .with({ type: "func" }, ({ value }) => `FUNC(${value})`)
    .exhaustive();
}

// RUN STATEMENT

export function runStatement(
  environment: Environment,
  statement: Statement,
  emitHandler?: (x: string) => void
): Environment {
  return E.match(
    (e: EvaluationError) => {
      throw new Error(evaluationErrorToString(e));
    },
    (v: Environment) => v
  )(runStatementSafely(environment, statement, emitHandler));
}

function runStatementSafelyCurried(environment: Environment) {
  return (statement: Statement) =>
    (
      emitHandler?: (x: string) => void
    ): E.Either<EvaluationError, Environment> =>
      runStatementSafely(environment, statement, emitHandler);
}

export function runStatementSafely(
  environment: Environment,
  statement: Statement,
  emitHandler?: (x: string) => void
): E.Either<EvaluationError, Environment> {
  return match(statement)
    .with({ type: "print" }, ({ value }) => {
      return pipe(
        evaluateExpressionSafely(environment, value),
        E.map(getStringValue),
        E.map((x) => addOutputToEnvironment(environment, x))
      );
    })
    .with({ type: "emit" }, ({ value }) => {
      const msgResult = pipe(
        evaluateExpressionSafely(environment, value),
        E.map(getStringValue)
      );
      E.fold(
        () => {},
        (msg: string) => {
          if (emitHandler) emitHandler(msg);
        }
      )(msgResult);
      return E.right(environment);
    })
    .with({ type: "bind" }, ({ value, identifier }) =>
      pipe(
        E.of(setVariable(environment)),
        E.ap(evaluateIdentifierSafely(environment, identifier)),
        E.ap(evaluateExpressionSafely(environment, value))
      )
    )

    .with({ type: "block" }, ({ statements }) => {
      const result = statements.reduce<E.Either<EvaluationError, Environment>>(
        (prev: E.Either<EvaluationError, Environment>, current: Statement) => {
          return pipe(
            prev,
            E.chain((x: Environment) => runStatementSafely(x, current))
          );
        },
        E.of(environment)
      );
      return result;
    })
    .with(
      { type: "if" },
      ({
        condition,
        thenStatement,
        elseStatement,
      }): E.Either<EvaluationError, Environment> =>
        pipe(
          evaluateExpressionSafely(environment, condition),
          E.map(isTruthy),
          E.chain((x) =>
            x
              ? runStatementSafely(environment, thenStatement)
              : elseStatement
              ? runStatementSafely(environment, elseStatement)
              : E.of(environment)
          )
        )
    )
    .with({ type: "proc_def" }, ({ statement, identifier }) =>
      pipe(
        evaluateIdentifierSafely(environment, identifier),
        E.map((x) => setProcedure(environment)(x)(statement))
      )
    )

    .with({ type: "proc_run" }, ({ identifier, args }) =>
      pipe(
        E.of(runStatementSafelyCurried),
        E.ap(environmentWithArgs(args, environment)),
        E.ap(
          pipe(
            evaluateIdentifierSafely(environment, identifier),
            E.chainW(getProcedure(environment))
          )
        ),
        E.ap(E.of(emitHandler)),
        E.flatten
      )
    )
    .with(
      { type: "random" },
      ({ identifier, from, to }): E.Either<EvaluationError, Environment> =>
        pipe(
          E.of(setVariable(environment)),
          E.ap(evaluateIdentifierSafely(environment, identifier)),
          E.ap(
            pipe(
              E.of(
                (x: Value) => (y: Value) =>
                  x.type == "number" && y.type == "number"
                    ? E.of(
                        n(
                          Math.round(
                            Math.random() * (y.value - x.value) + x.value
                          )
                        )
                      )
                    : E.left(evalError("undefined"))
              ),
              E.ap(evaluateExpressionSafely(environment, from)),
              E.ap(evaluateExpressionSafely(environment, to)),
              E.flatten
            )
          )
        )
    )

    .exhaustive();
}

function newEnvironment(e: Environment): Environment {
  return JSON.parse(JSON.stringify(e));
}

export function isTruthy(value: Value): Boolean {
  return match(value)
    .with({ type: "number" }, ({ value }) => value !== 0)
    .with({ type: "text" }, ({ value }) => value !== "")
    .otherwise(() => true);
}

// Expressions

export function createOutput(value: string): OutputLine {
  return { ts: new Date().valueOf(), value };
}

export function addOutputToEnvironment(
  environment: Environment,
  value: string
): Environment {
  return {
    ...environment,
    output: [...environment.output, createOutput(value)],
  };
}

export function stringifyValue(v: Value): string {
  return match(v)
    .with({ type: "number" }, ({ value }) => value + "")
    .with({ type: "text" }, ({ value }) => `"${value}"`)
    .with({ type: "func" }, ({ value }) => `FUNC ${stringifyExpression(value)}`)
    .exhaustive();
}

export function stringifyIdentifier(i: Identifier): string {
  return match(i)
    .with({ type: "literal" }, ({ value }) => value)
    .with(
      { type: "computed" },
      ({ value }) => `$[${stringifyExpression(value)}]`
    )
    .exhaustive();
}

export function stringifyExpression(e: Expression): string {
  return match(e)
    .with({ type: "literal" }, ({ value }) => stringifyValue(value))
    .with(
      { type: "binary_op" },
      ({ op, x, y }) =>
        `${stringifyExpression(x)} ${op}  ${stringifyExpression(y)}`
    )
    .with({ type: "var" }, ({ identifier }) => stringifyIdentifier(identifier))
    .with(
      { type: "fun_call" },
      ({ identifier, args }) =>
        `${stringifyIdentifier(identifier)}(${args.map((a) =>
          stringifyExpression(a)
        )})`
    )
    .with(
      { type: "parens" },
      ({ expression }) => `(${stringifyExpression(expression)})`
    )

    .with({ type: "unary_op" }, ({ op, x }) => `${op}${stringifyExpression(x)}`)

    .with(
      { type: "condition" },
      ({ condition, onFalse, onTrue }) =>
        `${stringifyExpression(condition)} ? ${stringifyExpression(
          onTrue
        )} : ${stringifyExpression(onFalse)}`
    )

    .exhaustive();
}

export function stringifyStatement(e: Statement): string {
  return match(e)
    .with(
      { type: "print" },
      ({ value }) => `PRINT ${stringifyExpression(value)}`
    )
    .with({ type: "emit" }, ({ value }) => `EMIT ${stringifyExpression(value)}`)
    .with(
      { type: "bind" },
      ({ value, identifier }) =>
        `${stringifyIdentifier(identifier)} = ${stringifyExpression(value)}`
    )
    .with(
      { type: "random" },
      ({ identifier, from, to }) =>
        `RND ${stringifyIdentifier(identifier)} ${stringifyExpression(
          from
        )} ${stringifyExpression(to)}`
    )
    .with(
      { type: "block" },
      ({ statements }) =>
        `{\n ${statements.map(stringifyStatement).join(";\n ")}\n}`
    )
    .with(
      { type: "if" },
      ({ thenStatement, elseStatement, condition }) =>
        `IF ${stringifyExpression(condition)} THEN ${stringifyStatement(
          thenStatement
        )} ${elseStatement ? `ELSE  ${stringifyStatement(elseStatement)}` : ``}`
    )
    .with(
      { type: "proc_run" },
      ({ identifier, args }) =>
        `${stringifyIdentifier(identifier)}(${args.map((a) =>
          stringifyExpression(a)
        )})`
    )
    .with(
      { type: "proc_def" },
      ({ identifier, statement }) =>
        "PROC " +
        stringifyIdentifier(identifier) +
        " " +
        stringifyStatement(statement)
    )

    .exhaustive();
}

/// AST Value constructors helpers
export function l(n: Value): Expression {
  return { type: "literal", value: n };
}

export function n(n: number): Value {
  return { type: "number", value: n };
}

export function t(n: string): Value {
  return { type: "text", value: n };
}

export function va(n: string): Expression {
  return { type: "var", identifier: { type: "literal", value: n } };
}

function evalErrorType(type: string, msg?: string): EvaluationErrorType {
  switch (type) {
    case "type-number":
      return "type error - number expected";
    case "undefined":
      return "undefined";
  }
  return "other evaluation error";
}

function evalError(type: string, msg?: string): EvaluationError {
  return { type: evalErrorType(type), ctx: msg || "" };
}

export function evaluationErrorToString(e: EvaluationError): string {
  return e.type + " : " + e.ctx;
}

function setVariable(environment: Environment) {
  return (id: string) => (v: Value) => {
    const newVars = { ...Object.assign(environment.vars, { [id]: v }) };
    return { ...environment, vars: newVars };
  };
}
function setProcedure(environment: Environment) {
  return (id: string) => (s: Statement) => {
    const newProcs = { ...Object.assign(environment.procedures, { [id]: s }) };
    return { ...environment, procedures: newProcs };
  };
}

function getProcedure(environment: Environment) {
  return (id: string): E.Either<EvaluationError, Statement> => {
    const proc = environment.procedures[id];
    if (!proc) return E.left(evalError("undefined"));
    else return E.of(proc);
  };
}

function environmentWithArgs(
  args: Expression[],
  environment: Environment
): E.Either<EvaluationError, Environment> {
  return pipe(
    args.map((a) => evaluateExpressionSafely(environment, a)),
    A.sequence(E.Applicative),
    E.map(
      A.reduceWithIndex(
        environment,
        (i: number, prev: Environment, cur: Value) =>
          setVariable(prev)(`_${i}`)(cur)
      )
    )
  );
}
