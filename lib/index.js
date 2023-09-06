"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringifyStatement = exports.stringifyExpression = exports.stringifyIdentifier = exports.stringifyValue = exports.addOutputToEnvironment = exports.createOutput = exports.l = exports.div = exports.mul = exports.sub = exports.add = exports.va = exports.fn = exports.t = exports.n = exports.isTruthy = exports.runStatement = exports.getStringValue = exports.evaluateExpression = exports.evaluateIdentifier = exports.parseStatement = exports.parseExpression = void 0;
const typescript_parsec_1 = require("typescript-parsec");
const ts_pattern_1 = require("ts-pattern");
const typescript_parsec_2 = require("typescript-parsec");
const typescript_parsec_3 = require("typescript-parsec");
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
(0, typescript_parsec_3.apply)((0, typescript_parsec_3.tok)(TokenKind.Number), (value) => l(n(+value.text))), 
// STRING
(0, typescript_parsec_3.apply)((0, typescript_parsec_3.tok)(TokenKind.String), (value) => l(t(value.text.substring(1, value.text.length - 1)))), 
// FUNC literal
(0, typescript_parsec_3.apply)((0, typescript_parsec_3.seq)((0, typescript_parsec_3.tok)(TokenKind.Func), CONDITIONAL_EXP), ([t1, value]) => l({ type: "func", value })), 
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
            return add(first, second[1]);
        case "-":
            return sub(first, second[1]);
        case "*":
            return mul(first, second[1]);
        case "/":
            return div(first, second[1]);
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
function parseExpression(expr) {
    return (0, typescript_parsec_2.expectSingleResult)((0, typescript_parsec_2.expectEOF)(CONDITIONAL_EXP.parse(lexer.parse(expr))));
}
exports.parseExpression = parseExpression;
function parseStatement(expr) {
    return (0, typescript_parsec_2.expectSingleResult)((0, typescript_parsec_2.expectEOF)(STMT.parse(lexer.parse(expr))));
}
exports.parseStatement = parseStatement;
// EXPRESSION EVALUATION
function evaluateIdentifier(environment, id) {
    if (id.type == "literal")
        return id.value;
    else {
        return getStringValue(evaluateExpression(environment, id.value, true));
    }
}
exports.evaluateIdentifier = evaluateIdentifier;
function evaluateExpression(environment, expression, safe) {
    try {
        return (0, ts_pattern_1.match)(expression)
            .returnType()
            .with({ type: "literal" }, ({ value }) => value)
            .with({ type: "binary_op" }, ({ x, y, op }) => {
            const evX = evaluateExpression(environment, x);
            const evY = evaluateExpression(environment, y);
            return evaluateBinaryExpression(evX, op, evY);
        })
            .with({ type: "var" }, ({ identifier }) => {
            const lookup = environment.vars[evaluateIdentifier(environment, identifier)];
            if (lookup)
                return lookup;
            else {
                if (safe)
                    return n(0);
                else
                    throw new Error(`Undefined identifier: {${identifier.value}}`);
            }
        })
            .with({ type: "unary_op" }, ({ op, x }) => (0, ts_pattern_1.match)(op)
            .with("-", () => {
            const value = evaluateExpression(environment, x);
            return (0, ts_pattern_1.match)(value)
                .with({ type: "number" }, ({ value }) => n(-value))
                .otherwise(() => {
                throw new Error("Unary only with numbers");
            });
        })
            .with("+", () => {
            const value = evaluateExpression(environment, x);
            return (0, ts_pattern_1.match)(value)
                .with({ type: "number" }, ({ value }) => n(+value))
                .otherwise(() => {
                throw new Error("Unary only with numbers");
            });
        })
            .with("!", () => isTruthy(evaluateExpression(environment, x)) ? n(0) : n(1))
            .exhaustive())
            .with({ type: "conditon" }, ({ condition, onTrue, onFalse }) => {
            const evCondition = evaluateExpression(environment, condition);
            return isTruthy(evCondition)
                ? evaluateExpression(environment, onTrue)
                : evaluateExpression(environment, onFalse);
        })
            .with({ type: "fun_call" }, ({ args, identifier }) => {
            const fnContent = environment.vars[evaluateIdentifier(environment, identifier)];
            if (!fnContent || fnContent.type !== "func") {
                throw new Error(`Undefined function: ${evaluateIdentifier(environment, identifier)}`);
            }
            const newEnv = newEnvironment(environment);
            const argsEvaluated = args.map((a) => evaluateExpression(environment, a));
            argsEvaluated.forEach((el, i) => {
                newEnv.vars[`_${i}`] = el;
            });
            return evaluateExpression(newEnv, fnContent.value);
        })
            .with({ type: "parens" }, ({ expression }) => evaluateExpression(environment, expression))
            .exhaustive();
    }
    catch (e) {
        console.log({ e }, "evaluating", expression);
        if (safe)
            return t("");
        else
            throw e;
    }
}
exports.evaluateExpression = evaluateExpression;
function evaluateBinaryExpression(x, op, y) {
    return (0, ts_pattern_1.match)(op)
        .with("+", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => n(xx.value + yy.value))
        .otherwise(() => t(getStringValue(x) + getStringValue(y))))
        .with("-", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => n(xx.value - yy.value))
        .otherwise(() => {
        throw new Error("TypeError");
    }))
        .with("*", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => n(xx.value * yy.value))
        .otherwise(() => {
        throw new Error("TypeError");
    }))
        .with("/", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => n(xx.value / yy.value))
        .otherwise(() => {
        throw new Error("TypeError");
    }))
        .with("//", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => n(Math.floor(xx.value / yy.value)))
        .otherwise(() => {
        throw new Error("TypeError");
    }))
        .with("==", () => x.type === y.type && getStringValue(x) === getStringValue(y) ? n(1) : n(0))
        .with("<", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => x.value < y.value ? n(1) : n(0))
        .otherwise(() => {
        throw new Error("TypeError");
    }))
        .with(">", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => x.value > y.value ? n(1) : n(0))
        .otherwise(() => {
        throw new Error("TypeError");
    }))
        .exhaustive();
}
function getStringValue(v) {
    return (0, ts_pattern_1.match)(v)
        .with({ type: "number" }, ({ value }) => String(value))
        .with({ type: "text" }, ({ value }) => value)
        .with({ type: "func" }, ({ value }) => `FUNC(${value})`)
        .exhaustive();
}
exports.getStringValue = getStringValue;
// RUN STATEMENT
function runStatement(environment, statement
// safe?: boolean
) {
    try {
        return (0, ts_pattern_1.match)(statement)
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
            return statements.reduce((prev, current) => {
                return runStatement(prev, current);
            }, environment);
        })
            .with({ type: "if" }, ({ condition, thenStatement: then, elseStatement }) => {
            if (isTruthy(evaluateExpression(environment, condition)))
                return runStatement(environment, then);
            else if (elseStatement)
                return runStatement(environment, elseStatement);
            else
                return environment;
        })
            .with({ type: "proc_def" }, ({ statement, identifier }) => {
            const nEnvironment = newEnvironment(environment);
            nEnvironment.procedures[evaluateIdentifier(environment, identifier)] =
                statement;
            return nEnvironment;
        })
            .with({ type: "proc_run" }, ({ identifier, args }) => {
            const procContent = environment.procedures[evaluateIdentifier(environment, identifier)];
            if (!procContent) {
                throw new Error(`Undefined procedure ${evaluateIdentifier(environment, identifier)}`);
            }
            const newEnv = newEnvironment(environment);
            const argsEvaluated = args.map((a) => evaluateExpression(environment, a));
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
    }
    catch (e) {
        console.log({ e }, "running", statement);
        if (false)
            return environment;
        else
            throw e;
    }
}
exports.runStatement = runStatement;
function newEnvironment(e) {
    return JSON.parse(JSON.stringify(e));
}
function isTruthy(value) {
    return (0, ts_pattern_1.match)(value)
        .with({ type: "number" }, ({ value }) => value !== 0)
        .with({ type: "text" }, ({ value }) => value !== "")
        .otherwise(() => true);
}
exports.isTruthy = isTruthy;
/// AST Value constructors helpers
function n(n) {
    return { type: "number", value: n };
}
exports.n = n;
function t(n) {
    return { type: "text", value: n };
}
exports.t = t;
function fn(n) {
    return { type: "func", value: parseExpression(n) };
}
exports.fn = fn;
function va(n) {
    return { type: "var", identifier: { type: "literal", value: n } };
}
exports.va = va;
function add(x, y) {
    return { type: "binary_op", x, op: "+", y };
}
exports.add = add;
function sub(x, y) {
    return { type: "binary_op", x, op: "-", y };
}
exports.sub = sub;
function mul(x, y) {
    return { type: "binary_op", x, op: "*", y };
}
exports.mul = mul;
function div(x, y) {
    return { type: "binary_op", x, op: "/", y };
}
exports.div = div;
// Expressions
function l(n) {
    return { type: "literal", value: n };
}
exports.l = l;
function createOutput(value) {
    return { ts: new Date().valueOf(), value };
}
exports.createOutput = createOutput;
function addOutputToEnvironment(environment, value) {
    return {
        ...environment,
        output: [...environment.output, createOutput(value)],
    };
}
exports.addOutputToEnvironment = addOutputToEnvironment;
function stringifyValue(v) {
    return (0, ts_pattern_1.match)(v)
        .with({ type: "number" }, ({ value }) => value + "")
        .with({ type: "text" }, ({ value }) => `"${value}"`)
        .with({ type: "func" }, ({ value }) => `FUNC ${stringifyExpression(value)}`)
        .exhaustive();
}
exports.stringifyValue = stringifyValue;
function stringifyIdentifier(i) {
    return (0, ts_pattern_1.match)(i)
        .with({ type: "literal" }, ({ value }) => value)
        .with({ type: "computed" }, ({ value }) => `$[${stringifyExpression(value)}]`)
        .exhaustive();
}
exports.stringifyIdentifier = stringifyIdentifier;
function stringifyExpression(e) {
    return (0, ts_pattern_1.match)(e)
        .with({ type: "literal" }, ({ value }) => stringifyValue(value))
        .with({ type: "binary_op" }, ({ op, x, y }) => `${stringifyExpression(x)} ${op}  ${stringifyExpression(y)}`)
        .with({ type: "var" }, ({ identifier }) => stringifyIdentifier(identifier))
        .with({ type: "fun_call" }, ({ identifier, args }) => `${stringifyIdentifier(identifier)}(${args.map((a) => stringifyExpression(a))})`)
        .with({ type: "parens" }, ({ expression }) => `(${stringifyExpression(expression)})`)
        .with({ type: "unary_op" }, ({ op, x }) => `${op}${stringifyExpression(x)}`)
        .with({ type: "conditon" }, ({ condition, onFalse, onTrue }) => `${stringifyExpression(condition)} ? ${stringifyExpression(onTrue)} : ${stringifyExpression(onFalse)}`)
        .exhaustive();
}
exports.stringifyExpression = stringifyExpression;
function stringifyStatement(e) {
    return ((0, ts_pattern_1.match)(e)
        .with({ type: "print" }, ({ value }) => `PRINT ${stringifyExpression(value)}`)
        .with({ type: "bind" }, ({ value, identifier }) => `${stringifyIdentifier(identifier)} = ${stringifyExpression(value)}`)
        .with({ type: "random" }, ({ identifier, from, to }) => `RND ${stringifyIdentifier(identifier)} ${stringifyExpression(from)} ${stringifyExpression(to)}`)
        .with({ type: "block" }, ({ statements }) => `{\n ${statements.map(stringifyStatement).join(";\n ")}\n}`)
        .with({ type: "if" }, ({ thenStatement, elseStatement, condition }) => `IF ${stringifyExpression(condition)} THEN ${stringifyStatement(thenStatement)} ${elseStatement ? `ELSE  ${stringifyStatement(elseStatement)}` : ``}`)
        .with({ type: "proc_run" }, ({ identifier, args }) => `${stringifyIdentifier(identifier)}(${args.map((a) => stringifyExpression(a))})`)
        .with({ type: "proc_def" }, ({ identifier, statement }) => "PROC " +
        stringifyIdentifier(identifier) +
        " " +
        stringifyStatement(statement))
        // .with(
        //   { type: "binary_op" },
        //   ({ op, x, y }) =>
        //     `${stringifyExpression(x)} ${op}  ${stringifyExpression(y)}`
        // )
        // .with({ type: "var" }, ({ identifier }) => stringifyIdentifier(identifier))
        // .with(
        //   { type: "fun_call" },
        //   ({ identifier, args }) =>
        //     `${stringifyIdentifier(identifier)}(${args.map((a) =>
        //       stringifyExpression(a)
        //     )})`
        // )
        // .with({ type: "parens" }, ({ expression }) => `(${stringifyExpression})`)
        // .with({ type: "unary_op" }, ({ op, x }) => `${op}${stringifyExpression(x)}`)
        // .with(
        //   { type: "conditon" },
        //   ({ condition, onFalse, onTrue }) =>
        //     `${stringifyExpression(condition)} ? ${stringifyExpression(
        //       onTrue
        //     )} : ${stringifyExpression(onFalse)}`
        // )
        .exhaustive());
}
exports.stringifyStatement = stringifyStatement;
