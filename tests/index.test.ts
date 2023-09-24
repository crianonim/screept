import {
  n,
  l,
  t,
  Value,
  Environment,
  runStatementSafely,
  Identifier,
  Expression,
} from "../src/ast";
import { parseExpressionSafely } from "../src/index";
import * as E from "fp-ts/Either";
const n0 = n(0);
const n1 = n(1);
const n2 = n(2);
const n3 = n(3);
const n4 = n(4);
const tJan = t("Jan");
const expr0: Expression = { type: "binary_op", x: l(n1), y: l(n2), op: "+" };
const fAdd: Value = {
  type: "func",
  value: expr0,
};
const id0: Identifier = { type: "literal", value: "var1" };
describe("value parsing", () => {
  test("a number to be parsed", () => {
    testParse("1", l(n1));
  });
  test("a string to be parsed", () => {
    testParse('"Jan"', l(tJan));
  });
  test("a function to be parsed", () => {
    testParse("FUNC 1 + 2", l(fAdd));
  });
});

const env: Environment = {
  vars: {},
  output: [],
  procedures: {},
};
describe("run statement ", () => {
  test("bind", () => {
    testRight(
      runStatementSafely(env, {
        type: "bind",
        identifier: id0,
        value: expr0,
      }),
      ({ vars }) => expect(vars["var1"]).toEqual(n3)
    );
  });

  test("print", () => {
    testRight(
      runStatementSafely(env, {
        type: "print",
        value: l(tJan),
      }),
      ({ output }) => expect(output[0].value).toEqual("Jan")
    );
  });
  test("emit", () => {
    const mockFunc = jest.fn();
    testRight(
      runStatementSafely(
        env,
        {
          type: "emit",
          value: l(tJan),
        },
        mockFunc
      ),
      () => expect(mockFunc).toBeCalledWith("Jan")
    );
  });
  test("empty block", () => {
    testRight(
      runStatementSafely(env, {
        type: "block",
        statements: [],
      }),
      (environment) => expect(environment).toStrictEqual(env)
    );
  });
  test("block", () => {
    testRight(
      runStatementSafely(env, {
        type: "block",
        statements: [
          {
            type: "print",
            value: l(tJan),
          },
          {
            type: "bind",
            identifier: id0,
            value: expr0,
          },
          {
            type: "print",
            value: { type: "var", identifier: id0 },
          },
        ],
      }),
      ({ vars, output }) => {
        expect(output).toHaveLength(2);
        expect(output[0].value).toBe("Jan");
        expect(output[1].value).toBe("3");
        expect(vars["var1"]).toEqual(n3);
      }
    );
  });
});

function testRight<E, T>(e: E.Either<E, T>, fn: (x: T) => void): void {
  if (e._tag === "Right") {
    fn(e.right);
  } else throw new Error(`${e} is Left`);
}

function testParse(exprString: string, v: Expression): void {
  testRight(parseExpressionSafely(exprString), (r) => expect(r).toEqual(v));
}
