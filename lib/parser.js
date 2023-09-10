"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStatementSafely = exports.parseExpressionSafely = exports.parseStatement = exports.parseExpression = void 0;
const typescript_parsec_1 = require("typescript-parsec");
const E = __importStar(require("fp-ts/Either"));
const typescript_parsec_2 = require("typescript-parsec");
const typescript_parsec_3 = require("typescript-parsec");
const ast_1 = require("./ast");
//Lexer
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["String"] = 0] = "String";
    TokenKind[TokenKind["Number"] = 1] = "Number";
    TokenKind[TokenKind["Add"] = 2] = "Add";
    TokenKind[TokenKind["Sub"] = 3] = "Sub";
    TokenKind[TokenKind["Mul"] = 4] = "Mul";
    TokenKind[TokenKind["Div"] = 5] = "Div";
    TokenKind[TokenKind["DivDiv"] = 6] = "DivDiv";
    TokenKind[TokenKind["LParen"] = 7] = "LParen";
    TokenKind[TokenKind["RParen"] = 8] = "RParen";
    TokenKind[TokenKind["Space"] = 9] = "Space";
    TokenKind[TokenKind["ConditionalStart"] = 10] = "ConditionalStart";
    TokenKind[TokenKind["ConditionalEnd"] = 11] = "ConditionalEnd";
    TokenKind[TokenKind["Identifier"] = 12] = "Identifier";
    TokenKind[TokenKind["ComputedIdentifierStart"] = 13] = "ComputedIdentifierStart";
    TokenKind[TokenKind["ComputedIdentifierEnd"] = 14] = "ComputedIdentifierEnd";
    TokenKind[TokenKind["Bind"] = 15] = "Bind";
    TokenKind[TokenKind["Print"] = 16] = "Print";
    TokenKind[TokenKind["Comma"] = 17] = "Comma";
    TokenKind[TokenKind["LBracket"] = 18] = "LBracket";
    TokenKind[TokenKind["RBracket"] = 19] = "RBracket";
    TokenKind[TokenKind["SemiColon"] = 20] = "SemiColon";
    TokenKind[TokenKind["Func"] = 21] = "Func";
    TokenKind[TokenKind["If"] = 22] = "If";
    TokenKind[TokenKind["Then"] = 23] = "Then";
    TokenKind[TokenKind["Else"] = 24] = "Else";
    TokenKind[TokenKind["Not"] = 25] = "Not";
    TokenKind[TokenKind["NewLine"] = 26] = "NewLine";
    TokenKind[TokenKind["ProcDef"] = 27] = "ProcDef";
    TokenKind[TokenKind["ProcRun"] = 28] = "ProcRun";
    TokenKind[TokenKind["Rnd"] = 29] = "Rnd";
    TokenKind[TokenKind["Equal"] = 30] = "Equal";
    TokenKind[TokenKind["Greater"] = 31] = "Greater";
    TokenKind[TokenKind["LessThan"] = 32] = "LessThan";
})(TokenKind || (TokenKind = {}));
const lexer = (0, typescript_parsec_2.buildLexer)([
    [true, /^".*?"/g, TokenKind.String],
    [true, /^PRINT/g, TokenKind.Print],
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
const IDENTIFIER = (0, typescript_parsec_2.rule)();
const TERM = (0, typescript_parsec_2.rule)();
const FACTOR_EXP = (0, typescript_parsec_2.rule)();
const BINARY_EXP = (0, typescript_parsec_2.rule)();
const COMPARISON_EXP = (0, typescript_parsec_2.rule)();
const CONDITIONAL_EXP = (0, typescript_parsec_2.rule)();
const STMT = (0, typescript_parsec_2.rule)();
IDENTIFIER.setPattern((0, typescript_parsec_1.alt_sc)((0, typescript_parsec_3.apply)((0, typescript_parsec_3.tok)(TokenKind.Identifier), (value) => ({
    type: "literal",
    value: value.text,
})), (0, typescript_parsec_3.apply)((0, typescript_parsec_3.kmid)((0, typescript_parsec_3.tok)(TokenKind.ComputedIdentifierStart), CONDITIONAL_EXP, (0, typescript_parsec_3.tok)(TokenKind.ComputedIdentifierEnd)), (value) => ({ type: "computed", value: value }))));
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
TERM.setPattern((0, typescript_parsec_1.alt_sc)(
// NUMBER literal
(0, typescript_parsec_3.apply)((0, typescript_parsec_3.tok)(TokenKind.Number), (value) => (0, ast_1.l)((0, ast_1.n)(+value.text))), 
// STRING
(0, typescript_parsec_3.apply)((0, typescript_parsec_3.tok)(TokenKind.String), (value) => (0, ast_1.l)((0, ast_1.t)(value.text.substring(1, value.text.length - 1)))), 
// FUNC literal
(0, typescript_parsec_3.apply)((0, typescript_parsec_3.seq)((0, typescript_parsec_3.tok)(TokenKind.Func), CONDITIONAL_EXP), ([t1, value]) => (0, ast_1.l)({ type: "func", value })), 
// FUNC call
(0, typescript_parsec_3.apply)((0, typescript_parsec_3.seq)(IDENTIFIER, (0, typescript_parsec_3.tok)(TokenKind.LParen), (0, typescript_parsec_1.opt)((0, typescript_parsec_1.list_sc)(CONDITIONAL_EXP, (0, typescript_parsec_3.str)(","))), (0, typescript_parsec_3.tok)(TokenKind.RParen)), ([identifier, a, args]) => ({
    type: "fun_call",
    identifier,
    args: args || [],
})), 
// VAR resolution
(0, typescript_parsec_3.apply)(IDENTIFIER, (identifier) => ({
    type: "var",
    identifier,
})), 
// UNARY
(0, typescript_parsec_3.apply)((0, typescript_parsec_3.seq)((0, typescript_parsec_3.alt)((0, typescript_parsec_3.str)("+"), (0, typescript_parsec_3.str)("-"), (0, typescript_parsec_3.str)("!")), TERM), ([opToken, expression]) => {
    if (opToken.text == "+" || opToken.text == "-" || opToken.text == "!")
        return {
            type: "unary_op",
            op: opToken.text,
            x: expression,
        };
    else
        throw new Error(`Invalid unary op ${opToken.text}`);
}), 
// Parens
(0, typescript_parsec_3.apply)((0, typescript_parsec_3.kmid)((0, typescript_parsec_3.str)("("), CONDITIONAL_EXP, (0, typescript_parsec_3.str)(")")), (value) => ({
    type: "parens",
    expression: value,
}))));
/*
  FACTOR_EXP
    = TERM ('*' | '/') TERM
  */
FACTOR_EXP.setPattern((0, typescript_parsec_3.lrec_sc)(TERM, (0, typescript_parsec_3.seq)((0, typescript_parsec_3.alt)((0, typescript_parsec_3.str)("*"), (0, typescript_parsec_3.str)("//"), (0, typescript_parsec_3.str)("/")), TERM), applyBinary));
/*
  BINARY_EXP
    = FACTOR_EXP ('+' | '-' ) FACTOR_EXP
  */
BINARY_EXP.setPattern((0, typescript_parsec_3.lrec_sc)(FACTOR_EXP, (0, typescript_parsec_3.seq)((0, typescript_parsec_3.alt)((0, typescript_parsec_3.str)("+"), (0, typescript_parsec_3.str)("-")), FACTOR_EXP), applyBinary));
COMPARISON_EXP.setPattern((0, typescript_parsec_3.lrec_sc)(BINARY_EXP, (0, typescript_parsec_3.seq)((0, typescript_parsec_3.alt)((0, typescript_parsec_3.str)("=="), (0, typescript_parsec_3.str)(">"), (0, typescript_parsec_3.str)("<")), BINARY_EXP), applyBinary));
/*
  CONDITIONAL_EXP
    = BINARY_EXP ? BINARY_EXP : BINARY_EXP
  */
CONDITIONAL_EXP.setPattern((0, typescript_parsec_1.alt_sc)((0, typescript_parsec_3.apply)((0, typescript_parsec_3.seq)(COMPARISON_EXP, (0, typescript_parsec_3.tok)(TokenKind.ConditionalStart), COMPARISON_EXP, (0, typescript_parsec_3.tok)(TokenKind.ConditionalEnd), CONDITIONAL_EXP), ([first, t1, onTrue, t2, onFalse]) => ({
    type: "conditon",
    condition: first,
    onTrue,
    onFalse,
})), (0, typescript_parsec_3.apply)((0, typescript_parsec_3.seq)(COMPARISON_EXP, (0, typescript_parsec_3.tok)(TokenKind.ConditionalStart), CONDITIONAL_EXP, (0, typescript_parsec_3.tok)(TokenKind.ConditionalEnd), CONDITIONAL_EXP), ([first, t1, onTrue, t2, onFalse]) => ({
    type: "conditon",
    condition: first,
    onTrue,
    onFalse,
})), COMPARISON_EXP));
STMT.setPattern((0, typescript_parsec_3.alt)((0, typescript_parsec_3.apply)((0, typescript_parsec_3.seq)(IDENTIFIER, (0, typescript_parsec_3.tok)(TokenKind.Bind), CONDITIONAL_EXP), (second) => ({
    type: "bind",
    identifier: second[0],
    value: second[2],
})), (0, typescript_parsec_3.apply)((0, typescript_parsec_3.seq)((0, typescript_parsec_3.tok)(TokenKind.Print), CONDITIONAL_EXP), ([t1, value]) => {
    return { type: "print", value };
}), (0, typescript_parsec_3.apply)((0, typescript_parsec_3.kmid)((0, typescript_parsec_3.tok)(TokenKind.LBracket), (0, typescript_parsec_1.list_sc)(STMT, (0, typescript_parsec_3.str)(";")), (0, typescript_parsec_3.seq)((0, typescript_parsec_1.opt)((0, typescript_parsec_3.str)(";")), (0, typescript_parsec_3.tok)(TokenKind.RBracket))), (statements) => ({ type: "block", statements })), (0, typescript_parsec_3.apply)((0, typescript_parsec_3.seq)((0, typescript_parsec_3.tok)(TokenKind.ProcDef), IDENTIFIER, STMT), ([t1, identifier, statement]) => {
    return {
        type: "proc_def",
        statement,
        identifier,
    };
}), (0, typescript_parsec_3.apply)((0, typescript_parsec_3.seq)((0, typescript_parsec_3.tok)(TokenKind.ProcRun), IDENTIFIER, (0, typescript_parsec_3.tok)(TokenKind.LParen), (0, typescript_parsec_1.opt)((0, typescript_parsec_1.list_sc)(CONDITIONAL_EXP, (0, typescript_parsec_3.str)(","))), (0, typescript_parsec_3.tok)(TokenKind.RParen)), ([t1, identifier, lp, args, rp]) => ({
    type: "proc_run",
    identifier,
    args: args || [],
})), (0, typescript_parsec_3.apply)((0, typescript_parsec_3.seq)((0, typescript_parsec_3.tok)(TokenKind.Rnd), IDENTIFIER, CONDITIONAL_EXP, CONDITIONAL_EXP), ([t1, identifier, from, to]) => ({
    type: "random",
    identifier,
    from,
    to,
})), (0, typescript_parsec_3.apply)((0, typescript_parsec_3.seq)((0, typescript_parsec_3.tok)(TokenKind.If), CONDITIONAL_EXP, (0, typescript_parsec_3.tok)(TokenKind.Then), STMT, (0, typescript_parsec_1.opt)((0, typescript_parsec_1.kright)((0, typescript_parsec_3.tok)(TokenKind.Else), STMT))), ([a, expr, b, thenStmt, elseStmt]) => ({
    type: "if",
    condition: expr,
    thenStatement: thenStmt,
    elseStatement: elseStmt,
}))));
function applyBinary(first, second) {
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
function parseExpression(expr) {
    return E.match((e) => {
        throw new Error(e.message);
    }, (v) => v)(parseExpressionSafely(expr));
}
exports.parseExpression = parseExpression;
//can throw errors
function parseStatement(expr) {
    return E.match((e) => {
        throw new Error(e.message);
    }, (s) => s)(parseStatementSafely(expr));
}
exports.parseStatement = parseStatement;
function parseExpressionSafely(expr) {
    const result = (0, typescript_parsec_2.expectEOF)(CONDITIONAL_EXP.parse(lexer.parse(expr)));
    if (result.successful)
        return E.right((0, typescript_parsec_2.expectSingleResult)(result));
    else
        return E.left(result.error);
}
exports.parseExpressionSafely = parseExpressionSafely;
function parseStatementSafely(expr) {
    const result = (0, typescript_parsec_2.expectEOF)(STMT.parse(lexer.parse(expr)));
    if (result.successful)
        return E.right((0, typescript_parsec_2.expectSingleResult)(result));
    else
        return E.left(result.error);
}
exports.parseStatementSafely = parseStatementSafely;
