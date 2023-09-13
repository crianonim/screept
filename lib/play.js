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
const S = __importStar(require("./index"));
const E = __importStar(require("fp-ts/Either"));
const zod_mock_1 = require("@anatine/zod-mock");
try {
    const stat = (0, zod_mock_1.generateMock)(S.schemaStatement);
    console.log(S.stringifyStatement(stat));
    const pp = S.schemaStatement.safeParse(stat);
    console.log({ pp });
}
catch (e) {
    console.log("Error");
}
const parsed = E.matchW(() => "error", (p) => S.schemaExpression.safeParse({ ...p }))(S.parseExpressionSafely("12 + -213"));
console.log(parsed);
// console.log(S.stringifyIdentifier2(generateMock(S.schemaIdentifier)));
// const userArbitrary = ZodFastCheck().inputOf(S.schemaExpression);
// console.log(userArbitrary);
