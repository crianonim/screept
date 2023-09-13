import * as E from "fp-ts/Either";
import { z } from "zod";
declare const schemaValueFuncBase: z.ZodObject<{
    type: z.ZodLiteral<"func">;
}, "strip", z.ZodTypeAny, {
    type: "func";
}, {
    type: "func";
}>;
type ValueFunc = z.infer<typeof schemaValueFuncBase> & {
    value: Expression;
};
declare const schemaValue: z.ZodUnion<[z.ZodObject<{
    type: z.ZodLiteral<"number">;
    value: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "number";
    value: number;
}, {
    type: "number";
    value: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"text">;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "text";
    value: string;
}, {
    type: "text";
    value: string;
}>, z.ZodType<ValueFunc, z.ZodTypeDef, ValueFunc>]>;
export type Value = z.infer<typeof schemaValue>;
declare const schemaIndentifierComputedBase: z.ZodObject<{
    type: z.ZodLiteral<"computed">;
}, "strip", z.ZodTypeAny, {
    type: "computed";
}, {
    type: "computed";
}>;
type IndentifierComputed = z.infer<typeof schemaIndentifierComputedBase> & {
    value: Expression;
};
export declare const schemaIdentifier: z.ZodUnion<[z.ZodObject<{
    type: z.ZodLiteral<"literal">;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "literal";
    value: string;
}, {
    type: "literal";
    value: string;
}>, z.ZodType<IndentifierComputed, z.ZodTypeDef, IndentifierComputed>]>;
export type Identifier = z.infer<typeof schemaIdentifier>;
declare const schemaUnaryOp: z.ZodUnion<[z.ZodLiteral<"+">, z.ZodLiteral<"-">, z.ZodLiteral<"!">]>;
export type UnaryOp = z.infer<typeof schemaUnaryOp>;
type ExpressionUnary = z.infer<typeof schemaExpressionUnaryBase> & {
    x: Expression;
};
declare const schemaExpressionUnaryBase: z.ZodObject<{
    type: z.ZodLiteral<"unary_op">;
    op: z.ZodUnion<[z.ZodLiteral<"+">, z.ZodLiteral<"-">, z.ZodLiteral<"!">]>;
}, "strip", z.ZodTypeAny, {
    type: "unary_op";
    op: "+" | "-" | "!";
}, {
    type: "unary_op";
    op: "+" | "-" | "!";
}>;
declare const schemaBinaryOp: z.ZodUnion<[z.ZodLiteral<"+">, z.ZodLiteral<"-">, z.ZodLiteral<"*">, z.ZodLiteral<"/">, z.ZodLiteral<"//">, z.ZodLiteral<"==">, z.ZodLiteral<"<">, z.ZodLiteral<">">]>;
export type BinaryOp = z.infer<typeof schemaBinaryOp>;
declare const schemaExpressionBinaryBase: z.ZodObject<{
    type: z.ZodLiteral<"binary_op">;
    op: z.ZodUnion<[z.ZodLiteral<"+">, z.ZodLiteral<"-">, z.ZodLiteral<"*">, z.ZodLiteral<"/">, z.ZodLiteral<"//">, z.ZodLiteral<"==">, z.ZodLiteral<"<">, z.ZodLiteral<">">]>;
}, "strip", z.ZodTypeAny, {
    type: "binary_op";
    op: "+" | "-" | "*" | "/" | "//" | "==" | "<" | ">";
}, {
    type: "binary_op";
    op: "+" | "-" | "*" | "/" | "//" | "==" | "<" | ">";
}>;
type ExpressionBinary = z.infer<typeof schemaExpressionBinaryBase> & {
    x: Expression;
    y: Expression;
};
declare const schemaExpressionVarBase: z.ZodObject<{
    type: z.ZodLiteral<"var">;
}, "strip", z.ZodTypeAny, {
    type: "var";
}, {
    type: "var";
}>;
type ExpressionVar = z.infer<typeof schemaExpressionVarBase> & {
    identifier: Identifier;
};
declare const schemaExpressionConditionalBase: z.ZodObject<{
    type: z.ZodLiteral<"conditon">;
}, "strip", z.ZodTypeAny, {
    type: "conditon";
}, {
    type: "conditon";
}>;
type ExpressionCondition = z.infer<typeof schemaExpressionConditionalBase> & {
    condition: Expression;
    onTrue: Expression;
    onFalse: Expression;
};
declare const schemaExpressionFunCallBase: z.ZodObject<{
    type: z.ZodLiteral<"fun_call">;
}, "strip", z.ZodTypeAny, {
    type: "fun_call";
}, {
    type: "fun_call";
}>;
type ExpressionFunCall = z.infer<typeof schemaExpressionFunCallBase> & {
    identifier: Identifier;
    args: Expression[];
};
declare const schemaExpressionParensBase: z.ZodObject<{
    type: z.ZodLiteral<"parens">;
}, "strip", z.ZodTypeAny, {
    type: "parens";
}, {
    type: "parens";
}>;
type ExpressionParens = z.infer<typeof schemaExpressionParensBase> & {
    expression: Expression;
};
export declare const schemaExpression: z.ZodUnion<[z.ZodObject<{
    type: z.ZodLiteral<"literal">;
    value: z.ZodUnion<[z.ZodObject<{
        type: z.ZodLiteral<"number">;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        type: "number";
        value: number;
    }, {
        type: "number";
        value: number;
    }>, z.ZodObject<{
        type: z.ZodLiteral<"text">;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "text";
        value: string;
    }, {
        type: "text";
        value: string;
    }>, z.ZodType<ValueFunc, z.ZodTypeDef, ValueFunc>]>;
}, "strip", z.ZodTypeAny, {
    type: "literal";
    value: {
        type: "number";
        value: number;
    } | {
        type: "text";
        value: string;
    } | ({
        type: "func";
    } & {
        value: Expression;
    });
}, {
    type: "literal";
    value: {
        type: "number";
        value: number;
    } | {
        type: "text";
        value: string;
    } | ({
        type: "func";
    } & {
        value: Expression;
    });
}>, z.ZodType<ExpressionUnary, z.ZodTypeDef, ExpressionUnary>, z.ZodType<ExpressionBinary, z.ZodTypeDef, ExpressionBinary>, z.ZodType<ExpressionVar, z.ZodTypeDef, ExpressionVar>, z.ZodType<ExpressionCondition, z.ZodTypeDef, ExpressionCondition>, z.ZodType<ExpressionFunCall, z.ZodTypeDef, ExpressionFunCall>, z.ZodType<ExpressionParens, z.ZodTypeDef, ExpressionParens>]>;
export type Expression = z.infer<typeof schemaExpression>;
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
export declare function evaluateExpressionSafelyCurried(environment: Environment): (expression: Expression) => E.Either<EvaluationError, {
    type: "number";
    value: number;
} | {
    type: "text";
    value: string;
} | ValueFunc>;
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
