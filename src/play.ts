import * as S from "./index";
import { generateMock } from "@anatine/zod-mock";
import { ZodFastCheck } from "zod-fast-check";
// console.log(S.stringifyExpression(generateMock(S.schemaExpression)));

// console.log(S.stringifyIdentifier2(generateMock(S.schemaIdentifier)));

const userArbitrary = ZodFastCheck().inputOf(S.schemaExpression);
console.log(userArbitrary);
