import * as S from "./index";
import { generateMock } from "@anatine/zod-mock";

console.log(S.stringifyExpression(generateMock(S.schemaExpression)));

// console.log(S.stringifyIdentifier2(generateMock(S.schemaIdentifier)));
