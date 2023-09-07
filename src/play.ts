import * as O from "fp-ts/Option";
import * as E from "fp-ts/Either";
import { pipe, flow, absurd } from "fp-ts/function";
import * as A from "fp-ts/lib/Array";
import * as S from "./index";
const a: null | number = 5;
const b: null | number = 3;
const c: null | number = null;

const mA = O.fromNullable(a);
const mB = O.fromNullable(b);
const mC = O.fromNullable(c);
const double = (x: number) => x * 2;
const p = pipe(mA, O.map(double));
const f = pipe(a, flow(O.fromNullable));
const h = pipe(f, O.fromNullable, O.flatten);
const ch = pipe(
  f,
  O.chain((x) => (x > 4 ? O.none : O.some(x)))
);
const a1 = O.of(3);
const matching = O.match(
  () => "Oh now",
  (a) => "Good" + a
)(O.some("s"));
const folded = O.fold(
  () => 3,
  (x) => 4
);
const fooC = (a: number) => (b: number) => b + a;

const map2 = pipe(O.of(fooC), O.ap(mA), O.ap(mC));
const wd = O.getOrElse(() => 3)(mC);

const arr = [1, 2, 3].map(O.of);
const arr2: O.Option<number>[] = [O.of(1), O.none, O.of(3)];
const s1 = A.sequence(O.option)(arr2); // Option<number[]>
console.log("Safe Parse", S.parseExpressionSafely("a +  12 ? a : 12 ? 1 : 2"));

const env: S.Environment = { vars: {}, output: [], procedures: {} };
const result = pipe(
  S.parseExpressionSafely("1 +  12 ? 3 : 12 ? 1 : 2"),
  E.chainW(S.evaluateExpressionSafelyCurried(env))
);

console.log(result);
