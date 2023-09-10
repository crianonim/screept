import { n, l, t, Value } from "../src/ast";
import { parseExpressionSafely } from "../src/index";

const n0 = n(0);
const n1 = n(1);
const n2 = n(2);
const n3 = n(3);
const n4 = n(4);
const tJan = t("Jan");
const fAdd: Value = {
  type: "func",
  value: { type: "binary_op", x: l(n0), y: l(n1), op: "+" },
};
describe("value parsing", () => {
  test("a number to be parsed", () => {
    const result = parseExpressionSafely("1");
    expect(result._tag).toBe("Right");
    if (result._tag == "Right") {
      expect(result.right).toEqual(l(n1));
    }
  });
  test("a string to be parsed", () => {
    const result = parseExpressionSafely('"Jan"');
    expect(result._tag).toBe("Right");
    if (result._tag == "Right") {
      expect(result.right).toEqual(l(tJan));
    }
  });
  test("a function to be parsed", () => {
    const result = parseExpressionSafely("FUNC 0 + 1");
    expect(result._tag).toBe("Right");
    if (result._tag == "Right") {
      expect(result.right).toEqual(l(fAdd));
    }
  });
});
