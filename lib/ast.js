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
exports.evaluationErrorToString = exports.va = exports.t = exports.n = exports.l = exports.stringifyStatement = exports.stringifyExpression = exports.stringifyIdentifier = exports.stringifyValue = exports.addOutputToEnvironment = exports.createOutput = exports.isTruthy = exports.runStatementSafely = exports.runStatement = exports.getStringValue = exports.evaluateExpressionSafely = exports.evaluateExpressionSafelyCurried = exports.evaluateExpression = exports.evaluateIdentifierSafely = exports.evaluateIdentifier = exports.schemaEnvironment = exports.schemaStatement = exports.schemaExpression = exports.schemaIdentifier = exports.schemaValue = void 0;
// AST
const ts_pattern_1 = require("ts-pattern");
const function_1 = require("fp-ts/function");
const E = __importStar(require("fp-ts/Either"));
const A = __importStar(require("fp-ts/Array"));
const zod_1 = require("zod");
const schemaValueNumber = zod_1.z.object({
    type: zod_1.z.literal("number"),
    value: zod_1.z.number().nonnegative(),
});
const schemaValueText = zod_1.z.object({
    type: zod_1.z.literal("text"),
    value: zod_1.z.string(),
});
//todo
const schemaValueFuncBase = zod_1.z.object({
    type: zod_1.z.literal("func"),
});
const schemaValueFunc = schemaValueFuncBase.extend({
    value: zod_1.z.lazy(() => exports.schemaExpression),
});
exports.schemaValue = zod_1.z.union([
    schemaValueNumber,
    schemaValueText,
    schemaValueFunc,
]);
// Identifier
const schemaIndentifierLiteral = zod_1.z.object({
    type: zod_1.z.literal("literal"),
    value: zod_1.z.string(),
});
const schemaIndentifierComputedBase = zod_1.z.object({
    type: zod_1.z.literal("computed"),
});
const schemaIndentifierComputed = schemaIndentifierComputedBase.extend({
    value: zod_1.z.lazy(() => exports.schemaExpression),
});
exports.schemaIdentifier = zod_1.z.union([
    schemaIndentifierLiteral,
    schemaIndentifierComputed,
]);
// Expression Literal
const schemaExpressionLiteral = zod_1.z.object({
    type: zod_1.z.literal("literal"),
    value: exports.schemaValue,
});
const schemaUnaryOp = zod_1.z.union([zod_1.z.literal("+"), zod_1.z.literal("-"), zod_1.z.literal("!")]);
const schemaExpressionUnaryBase = zod_1.z.object({
    type: zod_1.z.literal("unary_op"),
    op: schemaUnaryOp,
});
const schemaExpressionUnary = schemaExpressionUnaryBase.extend({
    x: zod_1.z.lazy(() => exports.schemaExpression),
});
const schemaBinaryOp = zod_1.z.union([
    zod_1.z.literal("+"),
    zod_1.z.literal("-"),
    zod_1.z.literal("*"),
    zod_1.z.literal("/"),
    zod_1.z.literal("//"),
    zod_1.z.literal("=="),
    zod_1.z.literal("<"),
    zod_1.z.literal(">"),
]);
const schemaExpressionBinaryBase = zod_1.z.object({
    type: zod_1.z.literal("binary_op"),
    op: schemaBinaryOp,
});
const schemaExpressionBinary = schemaExpressionBinaryBase.extend({
    x: zod_1.z.lazy(() => exports.schemaExpression),
    y: zod_1.z.lazy(() => exports.schemaExpression),
});
const schemaExpressionVarBase = zod_1.z.object({ type: zod_1.z.literal("var") });
const schemaExpressionVar = schemaExpressionVarBase.extend({
    identifier: zod_1.z.lazy(() => exports.schemaIdentifier),
});
const schemaExpressionConditionalBase = zod_1.z.object({
    type: zod_1.z.literal("condition"),
});
const schemaExpressionConditional = schemaExpressionConditionalBase.extend({
    condition: zod_1.z.lazy(() => exports.schemaExpression),
    onTrue: zod_1.z.lazy(() => exports.schemaExpression),
    onFalse: zod_1.z.lazy(() => exports.schemaExpression),
});
const schemaExpressionFunCallBase = zod_1.z.object({
    type: zod_1.z.literal("fun_call"),
});
const schemaExpressionFunCall = schemaExpressionFunCallBase.extend({
    identifier: zod_1.z.lazy(() => exports.schemaIdentifier),
    args: zod_1.z.array(zod_1.z.lazy(() => exports.schemaExpression)),
});
const schemaExpressionParensBase = zod_1.z.object({
    type: zod_1.z.literal("parens"),
});
const schemaExpressionParens = schemaExpressionParensBase.extend({
    expression: zod_1.z.lazy(() => exports.schemaExpression),
});
exports.schemaExpression = zod_1.z.union([
    schemaExpressionLiteral,
    schemaExpressionUnary,
    schemaExpressionBinary,
    schemaExpressionVar,
    schemaExpressionConditional,
    schemaExpressionFunCall,
    schemaExpressionParens,
]);
const schemaStatementBind = zod_1.z.object({
    type: zod_1.z.literal("bind"),
    identifier: exports.schemaIdentifier,
    value: exports.schemaExpression,
});
const schemaStatementPrint = zod_1.z.object({
    type: zod_1.z.literal("print"),
    value: exports.schemaExpression,
});
const schemaStatementEmit = zod_1.z.object({
    type: zod_1.z.literal("emit"),
    value: exports.schemaExpression,
});
const schemaStatementProcDefBase = zod_1.z.object({
    type: zod_1.z.literal("proc_def"),
    identifier: exports.schemaIdentifier,
});
const schemaStatementProcDef = schemaStatementProcDefBase.extend({
    statement: zod_1.z.lazy(() => exports.schemaStatement),
});
const schemaStatementBlockBase = zod_1.z.object({
    type: zod_1.z.literal("block"),
});
const schemaStatementBlock = schemaStatementBlockBase.extend({
    statements: zod_1.z.array(zod_1.z.lazy(() => exports.schemaStatement)),
});
const schemaStatementProcRun = zod_1.z.object({
    type: zod_1.z.literal("proc_run"),
    identifier: exports.schemaIdentifier,
    args: zod_1.z.array(exports.schemaExpression),
});
const schemaStatementRandom = zod_1.z.object({
    type: zod_1.z.literal("random"),
    identifier: exports.schemaIdentifier,
    from: exports.schemaExpression,
    to: exports.schemaExpression,
});
const schemaStatementIfBase = zod_1.z.object({
    type: zod_1.z.literal("if"),
    condition: exports.schemaExpression,
});
const schemaStatementIf = schemaStatementIfBase.extend({
    thenStatement: zod_1.z.lazy(() => exports.schemaStatement),
    elseStatement: zod_1.z.lazy(() => exports.schemaStatement).optional(),
});
exports.schemaStatement = zod_1.z.union([
    schemaStatementBind,
    schemaStatementPrint,
    schemaStatementEmit,
    schemaStatementProcDef,
    schemaStatementProcRun,
    schemaStatementRandom,
    schemaStatementBlock,
    schemaStatementIf,
]);
const schemaOutputLine = zod_1.z.object({
    ts: zod_1.z.number().positive(),
    value: zod_1.z.string(),
});
exports.schemaEnvironment = zod_1.z.object({
    vars: zod_1.z.record(exports.schemaValue),
    procedures: zod_1.z.record(exports.schemaStatement),
    output: zod_1.z.array(schemaOutputLine),
});
function evaluateIdentifier(environment, id) {
    if (id.type == "literal")
        return id.value;
    else {
        return getStringValue(evaluateExpression(environment, id.value));
    }
}
exports.evaluateIdentifier = evaluateIdentifier;
function evaluateIdentifierSafely(environment, id) {
    if (id.type == "literal")
        return E.right(id.value);
    else {
        return (0, function_1.pipe)(evaluateExpressionSafely(environment, id.value), E.map(getStringValue));
    }
}
exports.evaluateIdentifierSafely = evaluateIdentifierSafely;
function evaluateExpression(environment, expression) {
    return E.match((e) => {
        throw new Error(evaluationErrorToString(e));
    }, (v) => v)(evaluateExpressionSafely(environment, expression));
}
exports.evaluateExpression = evaluateExpression;
function evaluateExpressionSafelyCurried(environment) {
    return (expression) => evaluateExpressionSafely(environment, expression);
}
exports.evaluateExpressionSafelyCurried = evaluateExpressionSafelyCurried;
function evaluateExpressionSafely(environment, expression) {
    return (0, ts_pattern_1.match)(expression)
        .with({ type: "literal" }, ({ value }) => E.of(value))
        .with({ type: "binary_op" }, ({ x, y, op }) => {
        const evX = evaluateExpressionSafely(environment, x);
        const evY = evaluateExpressionSafely(environment, y);
        return (0, function_1.pipe)(E.of((e1) => (e2) => evaluateBinaryExpressionSafely(op, e1, e2)), E.ap(evX), E.ap(evY), E.flatten);
    })
        .with({ type: "var" }, ({ identifier }) => (0, function_1.pipe)(evaluateIdentifierSafely(environment, identifier), E.chain((id) => !environment.vars[id]
        ? E.left({ type: "undefined", ctx: id })
        : E.right(environment.vars[id]))))
        .with({ type: "unary_op" }, ({ op, x }) => (0, ts_pattern_1.match)(op)
        .with("-", () => (0, function_1.pipe)(evaluateExpressionSafely(environment, x), E.chain((v) => (0, ts_pattern_1.match)(v)
        .with({ type: "number" }, ({ value }) => E.right(n(-value)))
        .otherwise(() => {
        return E.left(evalError("type-number"));
    }))))
        .with("+", () => (0, function_1.pipe)(evaluateExpressionSafely(environment, x), E.chain((v) => (0, ts_pattern_1.match)(v)
        .with({ type: "number" }, ({ value }) => E.right(n(+value)))
        .otherwise(() => {
        return E.left(evalError("type-number"));
    }))))
        .with("!", () => (0, function_1.pipe)(evaluateExpressionSafely(environment, x), E.map((x) => (isTruthy(x) ? n(0) : n(1)))))
        .exhaustive())
        .with({ type: "condition" }, ({ condition, onTrue, onFalse }) => (0, function_1.pipe)(evaluateExpressionSafely(environment, condition), E.chain((x) => isTruthy(x)
        ? evaluateExpressionSafely(environment, onTrue)
        : evaluateExpressionSafely(environment, onFalse))))
        .with({ type: "fun_call" }, ({ args, identifier }) => {
        const funcExpression = (0, function_1.pipe)(evaluateIdentifierSafely(environment, identifier), E.chain((id) => environment.vars[id] && environment.vars[id].type === "func"
            ? E.right(environment.vars[id].value)
            : E.left({ type: "undefined", ctx: id })));
        return (0, function_1.pipe)(E.of(evaluateExpressionSafelyCurried), E.ap(environmentWithArgs(args, environment)), E.ap(funcExpression), E.flatten);
    })
        .with({ type: "parens" }, ({ expression }) => evaluateExpressionSafely(environment, expression))
        .exhaustive();
}
exports.evaluateExpressionSafely = evaluateExpressionSafely;
function evaluateBinaryExpressionSafely(op, x, y) {
    return (0, ts_pattern_1.match)(op)
        .with("+", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => E.right(n(xx.value + yy.value)))
        .otherwise(() => E.right(t(getStringValue(x) + getStringValue(y)))))
        .with("-", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => E.right(n(xx.value - yy.value)))
        .otherwise(() => E.left(evalError("type error - number expected"))))
        .with("*", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => E.right(n(xx.value * yy.value)))
        .otherwise(() => E.left(evalError("type error - number expected"))))
        .with("/", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => E.right(n(xx.value / yy.value)))
        .otherwise(() => E.left(evalError("type error - number expected"))))
        .with("//", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => E.right(n(Math.floor(xx.value / yy.value))))
        .otherwise(() => E.left(evalError("type error - number expected"))))
        .with("==", () => E.right(x.type === y.type && getStringValue(x) === getStringValue(y)
        ? n(1)
        : n(0)))
        .with("<", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => E.right(xx.value < yy.value ? n(1) : n(0)))
        .otherwise(() => E.left(evalError("type error - number expected"))))
        .with(">", () => (0, ts_pattern_1.match)([x, y])
        .with([{ type: "number" }, { type: "number" }], ([xx, yy]) => E.right(xx.value > yy.value ? n(1) : n(0)))
        .otherwise(() => E.left(evalError("type error - number expected"))))
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
function runStatement(environment, statement, emitHandler) {
    return E.match((e) => {
        throw new Error(evaluationErrorToString(e));
    }, (v) => v)(runStatementSafely(environment, statement, emitHandler));
}
exports.runStatement = runStatement;
function runStatementSafelyCurried(environment) {
    return (statement) => (emitHandler) => runStatementSafely(environment, statement, emitHandler);
}
function runStatementSafely(environment, statement, emitHandler) {
    return (0, ts_pattern_1.match)(statement)
        .with({ type: "print" }, ({ value }) => {
        return (0, function_1.pipe)(evaluateExpressionSafely(environment, value), E.map(getStringValue), E.map((x) => addOutputToEnvironment(environment, x)));
    })
        .with({ type: "emit" }, ({ value }) => {
        const msgResult = (0, function_1.pipe)(evaluateExpressionSafely(environment, value), E.map(getStringValue));
        E.fold(() => { }, (msg) => {
            if (emitHandler)
                emitHandler(msg);
        })(msgResult);
        return E.right(environment);
    })
        .with({ type: "bind" }, ({ value, identifier }) => (0, function_1.pipe)(E.of(setVariable(environment)), E.ap(evaluateIdentifierSafely(environment, identifier)), E.ap(evaluateExpressionSafely(environment, value))))
        .with({ type: "block" }, ({ statements }) => {
        const result = statements.reduce((prev, current) => {
            return (0, function_1.pipe)(prev, E.chain((x) => runStatementSafely(x, current)));
        }, E.of(environment));
        return result;
    })
        .with({ type: "if" }, ({ condition, thenStatement, elseStatement, }) => (0, function_1.pipe)(evaluateExpressionSafely(environment, condition), E.map(isTruthy), E.chain((x) => x
        ? runStatementSafely(environment, thenStatement)
        : elseStatement
            ? runStatementSafely(environment, elseStatement)
            : E.of(environment))))
        .with({ type: "proc_def" }, ({ statement, identifier }) => (0, function_1.pipe)(evaluateIdentifierSafely(environment, identifier), E.map((x) => setProcedure(environment)(x)(statement))))
        .with({ type: "proc_run" }, ({ identifier, args }) => (0, function_1.pipe)(E.of(runStatementSafelyCurried), E.ap(environmentWithArgs(args, environment)), E.ap((0, function_1.pipe)(evaluateIdentifierSafely(environment, identifier), E.chainW(getProcedure(environment)))), E.ap(E.of(emitHandler)), E.flatten))
        .with({ type: "random" }, ({ identifier, from, to }) => (0, function_1.pipe)(E.of(setVariable(environment)), E.ap(evaluateIdentifierSafely(environment, identifier)), E.ap((0, function_1.pipe)(E.of((x) => (y) => x.type == "number" && y.type == "number"
        ? E.of(n(Math.round(Math.random() * (y.value - x.value) + x.value)))
        : E.left(evalError("undefined"))), E.ap(evaluateExpressionSafely(environment, from)), E.ap(evaluateExpressionSafely(environment, to)), E.flatten))))
        .exhaustive();
}
exports.runStatementSafely = runStatementSafely;
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
// Expressions
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
        .with({ type: "condition" }, ({ condition, onFalse, onTrue }) => `${stringifyExpression(condition)} ? ${stringifyExpression(onTrue)} : ${stringifyExpression(onFalse)}`)
        .exhaustive();
}
exports.stringifyExpression = stringifyExpression;
function stringifyStatement(e) {
    return (0, ts_pattern_1.match)(e)
        .with({ type: "print" }, ({ value }) => `PRINT ${stringifyExpression(value)}`)
        .with({ type: "emit" }, ({ value }) => `EMIT ${stringifyExpression(value)}`)
        .with({ type: "bind" }, ({ value, identifier }) => `${stringifyIdentifier(identifier)} = ${stringifyExpression(value)}`)
        .with({ type: "random" }, ({ identifier, from, to }) => `RND ${stringifyIdentifier(identifier)} ${stringifyExpression(from)} ${stringifyExpression(to)}`)
        .with({ type: "block" }, ({ statements }) => `{\n ${statements.map(stringifyStatement).join(";\n ")}\n}`)
        .with({ type: "if" }, ({ thenStatement, elseStatement, condition }) => `IF ${stringifyExpression(condition)} THEN ${stringifyStatement(thenStatement)} ${elseStatement ? `ELSE  ${stringifyStatement(elseStatement)}` : ``}`)
        .with({ type: "proc_run" }, ({ identifier, args }) => `${stringifyIdentifier(identifier)}(${args.map((a) => stringifyExpression(a))})`)
        .with({ type: "proc_def" }, ({ identifier, statement }) => "PROC " +
        stringifyIdentifier(identifier) +
        " " +
        stringifyStatement(statement))
        .exhaustive();
}
exports.stringifyStatement = stringifyStatement;
/// AST Value constructors helpers
function l(n) {
    return { type: "literal", value: n };
}
exports.l = l;
function n(n) {
    return { type: "number", value: n };
}
exports.n = n;
function t(n) {
    return { type: "text", value: n };
}
exports.t = t;
function va(n) {
    return { type: "var", identifier: { type: "literal", value: n } };
}
exports.va = va;
function evalErrorType(type, msg) {
    switch (type) {
        case "type-number":
            return "type error - number expected";
        case "undefined":
            return "undefined";
    }
    return "other evaluation error";
}
function evalError(type, msg) {
    return { type: evalErrorType(type), ctx: msg || "" };
}
function evaluationErrorToString(e) {
    return e.type + " : " + e.ctx;
}
exports.evaluationErrorToString = evaluationErrorToString;
function setVariable(environment) {
    return (id) => (v) => {
        const newVars = { ...Object.assign(environment.vars, { [id]: v }) };
        return { ...environment, vars: newVars };
    };
}
function setProcedure(environment) {
    return (id) => (s) => {
        const newProcs = { ...Object.assign(environment.procedures, { [id]: s }) };
        return { ...environment, procedures: newProcs };
    };
}
function getProcedure(environment) {
    return (id) => {
        const proc = environment.procedures[id];
        if (!proc)
            return E.left(evalError("undefined"));
        else
            return E.of(proc);
    };
}
function environmentWithArgs(args, environment) {
    return (0, function_1.pipe)(args.map((a) => evaluateExpressionSafely(environment, a)), A.sequence(E.Applicative), E.map(A.reduceWithIndex(environment, (i, prev, cur) => setVariable(prev)(`_${i}`)(cur))));
}
