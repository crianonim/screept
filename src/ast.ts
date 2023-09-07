// AST
import { match } from "ts-pattern";
import { pipe, flow } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as A from "fp-ts/Array";
export type Value =
  | { type: "number"; value: number }
  | { type: "text"; value: string }
  | { type: "func"; value: Expression };

export type Expression =
  | { type: "literal"; value: Value }
  | { type: "unary_op"; op: UnaryOp; x: Expression }
  | { type: "binary_op"; x: Expression; op: BinaryOp; y: Expression }
  | { type: "var"; identifier: Identifier }
  | {
      type: "conditon";
      condition: Expression;
      onTrue: Expression;
      onFalse: Expression;
    }
  | { type: "fun_call"; identifier: Identifier; args: Expression[] }
  | { type: "parens"; expression: Expression };

export type BinaryOp = "+" | "-" | "*" | "/" | "//" | "==" | "<" | ">";

export type UnaryOp = "+" | "-" | "!";

export type Identifier =
  | { type: "literal"; value: string }
  | { type: "computed"; value: Expression };

export type Environment = {
  vars: Record<string, Value>;
  procedures: Record<string, Statement>;
  output: OutputLine[];
};
export type OutputLine = { ts: number; value: string };

export type Statement =
  | { type: "bind"; identifier: Identifier; value: Expression }
  | { type: "block"; statements: Statement[] }
  | { type: "print"; value: Expression }
  | {
      type: "if";
      condition: Expression;
      thenStatement: Statement;
      elseStatement?: Statement;
    }
  | { type: "proc_def"; identifier: Identifier; statement: Statement }
  | { type: "proc_run"; identifier: Identifier; args: Expression[] }
  | {
      type: "random";
      identifier: Identifier;
      from: Expression;
      to: Expression;
    };

type EvaluationErrorType =
  | "type error - number expected"
  | "undefined"
  | "other evaluation error";

type EvaluationError = { type: EvaluationErrorType; ctx: string };

export function evaluateIdentifier(environment: Environment, id: Identifier) {
  if (id.type == "literal") return id.value;
  else {
    return getStringValue(evaluateExpression(environment, id.value, true));
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
  expression: Expression,
  safe = false
): Value {
  try {
    return match(expression)
      .returnType<Value>()
      .with({ type: "literal" }, ({ value }) => value)
      .with({ type: "binary_op" }, ({ x, y, op }) => {
        const evX = evaluateExpression(environment, x, safe);
        const evY = evaluateExpression(environment, y, safe);
        return evaluateBinaryExpression(evX, op, evY);
      })
      .with({ type: "var" }, ({ identifier }) => {
        const lookup =
          environment.vars[evaluateIdentifier(environment, identifier)];
        if (lookup) return lookup;
        else {
          if (safe) return n(0);
          else throw new Error(`Undefined identifier: {${identifier.value}}`);
        }
      })
      .with({ type: "unary_op" }, ({ op, x }) =>
        match(op)
          .with("-", () => {
            const value = evaluateExpression(environment, x);
            return match(value)
              .with({ type: "number" }, ({ value }) => n(-value))
              .otherwise(() => {
                throw new Error("Unary only with numbers");
              });
          })
          .with("+", () => {
            const value = evaluateExpression(environment, x);
            return match(value)
              .with({ type: "number" }, ({ value }) => n(+value))
              .otherwise(() => {
                throw new Error("Unary only with numbers");
              });
          })
          .with("!", () =>
            isTruthy(evaluateExpression(environment, x)) ? n(0) : n(1)
          )
          .exhaustive()
      )

      .with({ type: "conditon" }, ({ condition, onTrue, onFalse }) => {
        const evCondition = evaluateExpression(environment, condition);
        return isTruthy(evCondition)
          ? evaluateExpression(environment, onTrue)
          : evaluateExpression(environment, onFalse);
      })

      .with({ type: "fun_call" }, ({ args, identifier }) => {
        const fnContent =
          environment.vars[evaluateIdentifier(environment, identifier)];
        if (!fnContent || fnContent.type !== "func") {
          throw new Error(
            `Undefined function: ${evaluateIdentifier(environment, identifier)}`
          );
        }
        const newEnv = newEnvironment(environment);
        const argsEvaluated = args.map((a) =>
          evaluateExpression(environment, a)
        );
        argsEvaluated.forEach((el, i) => {
          newEnv.vars[`_${i}`] = el;
        });
        return evaluateExpression(newEnv, fnContent.value);
      })
      .with({ type: "parens" }, ({ expression }) =>
        evaluateExpression(environment, expression)
      )
      .exhaustive();
  } catch (e) {
    console.log({ e }, "evaluating", expression);
    if (safe) return t("");
    else throw e;
  }
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
      { type: "conditon" },
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
        const newEnvironment: E.Either<EvaluationError, Environment> = pipe(
          args.map((a) => evaluateExpressionSafely(environment, a)),
          A.sequence(E.Applicative),
          E.map(A.reduce(environment, (prev: Environment, cur: Value) => prev))
        );
        return pipe(
          E.of(evaluateExpressionSafelyCurried),
          E.ap(newEnvironment),
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

function evaluateBinaryExpression(x: Value, op: BinaryOp, y: Value): Value {
  return match(op)
    .with("+", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          n(xx.value + yy.value)
        )
        .otherwise(() => t(getStringValue(x) + getStringValue(y)))
    )
    .with("-", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          n(xx.value - yy.value)
        )
        .otherwise(() => {
          throw new Error("TypeError");
        })
    )
    .with("*", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          n(xx.value * yy.value)
        )
        .otherwise(() => {
          throw new Error("TypeError");
        })
    )
    .with("/", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          n(xx.value / yy.value)
        )
        .otherwise(() => {
          throw new Error("TypeError");
        })
    )
    .with("//", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          n(Math.floor(xx.value / yy.value))
        )
        .otherwise(() => {
          throw new Error("TypeError");
        })
    )
    .with("==", () =>
      x.type === y.type && getStringValue(x) === getStringValue(y) ? n(1) : n(0)
    )
    .with("<", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          x.value < y.value ? n(1) : n(0)
        )
        .otherwise(() => {
          throw new Error("TypeError");
        })
    )
    .with(">", () =>
      match([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) =>
          x.value > y.value ? n(1) : n(0)
        )
        .otherwise(() => {
          throw new Error("TypeError");
        })
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
  statement: Statement
  // safe?: boolean
): Environment {
  try {
    return match(statement)
      .with({ type: "print" }, ({ value }) => {
        const evEx = evaluateExpression(environment, value);
        console.log("PRINT", getStringValue(evEx));
        return addOutputToEnvironment(environment, getStringValue(evEx));
      })
      .with({ type: "bind" }, ({ value, identifier }) => {
        const evEx = evaluateExpression(environment, value);
        const id = evaluateIdentifier(environment, identifier);
        const nEnvironment = newEnvironment(environment);
        nEnvironment.vars[id] = evEx;
        return nEnvironment;
      })
      .with({ type: "block" }, ({ statements }) => {
        return statements.reduce<Environment>((prev, current) => {
          return runStatement(prev, current);
        }, environment);
      })
      .with(
        { type: "if" },
        ({ condition, thenStatement: then, elseStatement }) => {
          if (isTruthy(evaluateExpression(environment, condition)))
            return runStatement(environment, then);
          else if (elseStatement)
            return runStatement(environment, elseStatement);
          else return environment;
        }
      )
      .with({ type: "proc_def" }, ({ statement, identifier }) => {
        const nEnvironment = newEnvironment(environment);
        nEnvironment.procedures[evaluateIdentifier(environment, identifier)] =
          statement;
        return nEnvironment;
      })

      .with({ type: "proc_run" }, ({ identifier, args }) => {
        const procContent =
          environment.procedures[evaluateIdentifier(environment, identifier)];
        if (!procContent) {
          throw new Error(
            `Undefined procedure ${evaluateIdentifier(environment, identifier)}`
          );
        }
        const newEnv = newEnvironment(environment);
        const argsEvaluated = args.map((a) =>
          evaluateExpression(environment, a)
        );
        argsEvaluated.forEach((el, i) => {
          newEnv.vars[`_${i}`] = el;
        });
        return runStatement(newEnv, procContent);
      })
      .with({ type: "random" }, ({ identifier, from, to }) => {
        const fromEv = evaluateExpression(environment, from);
        const toEv = evaluateExpression(environment, to);
        if (fromEv.type !== "number" || toEv.type !== "number") {
          throw new Error("Random only accepts number ranges.");
        }
        const f = fromEv.value;
        const t = toEv.value;
        const generated = Math.round(Math.random() * (t - f) + f);
        const id = evaluateIdentifier(environment, identifier);
        const nEnvironment = newEnvironment(environment);
        nEnvironment.vars[id] = n(generated);
        return nEnvironment;
      })

      .exhaustive();
  } catch (e) {
    console.log({ e }, "running", statement);
    if (false) return environment;
    else throw e;
  }
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
      { type: "conditon" },
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
