import { ParseError } from "typescript-parsec";
import * as E from "fp-ts/Either";
import { Expression, Statement } from "./ast";
export declare function parseExpression(expr: string): Expression;
export declare function parseStatement(expr: string): Statement;
export declare function parseExpressionSafely(expr: string): E.Either<ParseError, Expression>;
export declare function parseStatementSafely(expr: string): E.Either<ParseError, Statement>;
