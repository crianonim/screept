import { random, randomElem } from "fp-ts/lib/Random";
import * as IO from "fp-ts/IO";
import * as A from "./ast";

export function generateValue(): number {
  return randomElem([12, 3])();
}
