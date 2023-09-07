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
const O = __importStar(require("fp-ts/Option"));
const E = __importStar(require("fp-ts/Either"));
const function_1 = require("fp-ts/function");
const A = __importStar(require("fp-ts/lib/Array"));
const S = __importStar(require("./index"));
const a = 5;
const b = 3;
const c = null;
const mA = O.fromNullable(a);
const mB = O.fromNullable(b);
const mC = O.fromNullable(c);
const double = (x) => x * 2;
const p = (0, function_1.pipe)(mA, O.map(double));
const f = (0, function_1.pipe)(a, (0, function_1.flow)(O.fromNullable));
const h = (0, function_1.pipe)(f, O.fromNullable, O.flatten);
const ch = (0, function_1.pipe)(f, O.chain((x) => (x > 4 ? O.none : O.some(x))));
const a1 = O.of(3);
const matching = O.match(() => "Oh now", (a) => "Good" + a)(O.some("s"));
const folded = O.fold(() => 3, (x) => 4);
const fooC = (a) => (b) => b + a;
const map2 = (0, function_1.pipe)(O.of(fooC), O.ap(mA), O.ap(mC));
const wd = O.getOrElse(() => 3)(mC);
const arr = [1, 2, 3].map(O.of);
const arr2 = [O.of(1), O.none, O.of(3)];
const s1 = A.sequence(O.option)(arr2); // Option<number[]>
console.log("Safe Parse", S.parseExpressionSafely("a +  12 ? a : 12 ? 1 : 2"));
const env = { vars: {}, output: [], procedures: {} };
const result = (0, function_1.pipe)(S.parseExpressionSafely("1 +  12 ? 3 : 12 ? 1 : 2"), E.chainW(S.evaluateExpressionSafelyCurried(env)));
console.log(result);
