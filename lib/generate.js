"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateValue = void 0;
const Random_1 = require("fp-ts/lib/Random");
function generateValue() {
    return (0, Random_1.randomElem)([12, 3])();
}
exports.generateValue = generateValue;
