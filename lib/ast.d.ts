import * as E from "fp-ts/Either";
export type Value = {
    type: "number";
    value: number;
} | {
    type: "text";
    value: string;
} | {
    type: "func";
    value: Expression;
};
export type Expression = {
    type: "literal";
    value: Value;
} | {
    type: "unary_op";
    op: UnaryOp;
    x: Expression;
} | {
    type: "binary_op";
    x: Expression;
    op: BinaryOp;
    y: Expression;
} | {
    type: "var";
    identifier: Identifier;
} | {
    type: "conditon";
    condition: Expression;
    onTrue: Expression;
    onFalse: Expression;
} | {
    type: "fun_call";
    identifier: Identifier;
    args: Expression[];
} | {
    type: "parens";
    expression: Expression;
};
export type BinaryOp = "+" | "-" | "*" | "/" | "//" | "==" | "<" | ">";
export type UnaryOp = "+" | "-" | "!";
export type Identifier = {
    type: "literal";
    value: string;
} | {
    type: "computed";
    value: Expression;
};
export type Environment = {
    vars: Record<string, Value>;
    procedures: Record<string, Statement>;
    output: OutputLine[];
};
export type OutputLine = {
    ts: number;
    value: string;
};
export type Statement = {
    type: "bind";
    identifier: Identifier;
    value: Expression;
} | {
    type: "block";
    statements: Statement[];
} | {
    type: "print";
    value: Expression;
} | {
    type: "if";
    condition: Expression;
    thenStatement: Statement;
    elseStatement?: Statement;
} | {
    type: "proc_def";
    identifier: Identifier;
    statement: Statement;
} | {
    type: "proc_run";
    identifier: Identifier;
    args: Expression[];
} | {
    type: "random";
    identifier: Identifier;
    from: Expression;
    to: Expression;
};
type EvaluationErrorType = "type error - number expected" | "undefined" | "other evaluation error";
type EvaluationError = {
    type: EvaluationErrorType;
    ctx: string;
};
export declare function evaluateIdentifier(environment: Environment, id: Identifier): string;
export declare function evaluateIdentifierSafely(environment: Environment, id: Identifier): E.Either<EvaluationError, string>;
export declare function evaluateExpression(environment: Environment, expression: Expression): Value;
export declare function evaluateExpressionSafelyCurried(environment: Environment): (expression: Expression) => E.Either<EvaluationError, Value>;
export declare function evaluateExpressionSafely(environment: Environment, expression: Expression): E.Either<EvaluationError, Value>;
export declare function getStringValue(v: Value): string;
export declare function runStatement(environment: Environment, statement: Statement): Environment;
export declare function runStatementSafely(environment: Environment, statement: Statement): E.Either<EvaluationError, Environment>;
export declare function isTruthy(value: Value): Boolean;
export declare function createOutput(value: string): OutputLine;
export declare function addOutputToEnvironment(environment: Environment, value: string): Environment;
export declare function stringifyValue(v: Value): string;
export declare function stringifyIdentifier(i: Identifier): string;
export declare function stringifyExpression(e: Expression): string;
export declare function stringifyStatement(e: Statement): string;
export declare function l(n: Value): Expression;
export declare function n(n: number): Value;
export declare function t(n: string): Value;
export declare function va(n: string): Expression;
export declare function evaluationErrorToString(e: EvaluationError): string;
export {};
