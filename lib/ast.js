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
exports.evaluationErrorToString = exports.va = exports.t = exports.n = exports.l = exports.stringifyStatement = exports.stringifyExpression = exports.stringifyIdentifier = exports.stringifyValue = exports.addOutputToEnvironment = exports.createOutput = exports.isTruthy = exports.runStatement = exports.getStringValue = exports.evaluateExpressionSafely = exports.evaluateExpressionSafelyCurried = exports.evaluateExpression = exports.evaluateIdentifierSafely = exports.evaluateIdentifier = void 0;
// AST
const ts_pattern_1 = require("ts-pattern");
const function_1 = require("fp-ts/function");
const E = __importStar(require("fp-ts/Either"));
const A = __importStar(require("fp-ts/Array"));
function evaluateIdentifier(environment, id) {
    if (id.type == "literal")
        return id.value;
    else {
        return getStringValue(evaluateExpression(environment, id.value, true));
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
function evaluateExpression(environment, expression, safe = false) {
    try {
        return (0, ts_pattern_1.match)(expression)
            .returnType()
            .with({ type: "literal" }, ({ value }) => value)
            .with({ type: "binary_op" }, ({ x, y, op }) => {
            const evX = evaluateExpression(environment, x, safe);
            const evY = evaluateExpression(environment, y, safe);
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
        .with({ type: "conditon" }, ({ condition, onTrue, onFalse }) => (0, function_1.pipe)(evaluateExpressionSafely(environment, condition), E.chain((x) => isTruthy(x)
        ? evaluateExpressionSafely(environment, onTrue)
        : evaluateExpressionSafely(environment, onFalse))))
        .with({ type: "fun_call" }, ({ args, identifier }) => {
        const funcExpression = (0, function_1.pipe)(evaluateIdentifierSafely(environment, identifier), E.chain((id) => environment.vars[id] && environment.vars[id].type === "func"
            ? E.right(environment.vars[id].value)
            : E.left({ type: "undefined", ctx: id })));
        const newEnvironment = (0, function_1.pipe)(args.map((a) => evaluateExpressionSafely(environment, a)), A.sequence(E.Applicative), E.map(A.reduce(environment, (prev, cur) => prev)));
        return (0, function_1.pipe)(E.of(evaluateExpressionSafelyCurried), E.ap(newEnvironment), E.ap(funcExpression), E.flatten);
    })
        .with({ type: "parens" }, ({ expression }) => evaluateExpressionSafely(environment, expression))
        .exhaustive();
}
exports.evaluateExpressionSafely = evaluateExpressionSafely;
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
        .with({ type: "conditon" }, ({ condition, onFalse, onTrue }) => `${stringifyExpression(condition)} ? ${stringifyExpression(onTrue)} : ${stringifyExpression(onFalse)}`)
        .exhaustive();
}
exports.stringifyExpression = stringifyExpression;
function stringifyStatement(e) {
    return (0, ts_pattern_1.match)(e)
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
