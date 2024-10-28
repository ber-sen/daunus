import { $if } from "./daunus_if";
import { Expect, Equal } from "./type_helpers";

describe("$if", () => {
  it("should provide expected types for return", () => {
    const condition = $if({ condition: Math.random() > 0.5 })
      .isTrue()

      .add("first step", ($) => $.condition)

      .add("second step", ($) => $.firstStep)

      .isFalse()

      .add("false step", () => ({ foo: "bar" }));

    const data = condition.run();

    type A = typeof data;

    type data = Expect<
      Equal<
        A,
        Promise<
          | true
          | {
              foo: string;
            }
        >
      >
    >;
  });

  it("should return the scope of true case", () => {
    const condition = $if({ condition: Math.random() > 0.5 })
      .isTrue()

      .add("first step", () => Promise.resolve([1, 2, 3]))

      .add("second step", ($) => $.condition)

      .isFalse()

      .add("false step", () => ({ foo: "bar" }));

    const localScope = condition.get("true").scope.local;

    type A = typeof localScope;

    type localScope = Expect<
      Equal<
        A,
        {
          condition: true;
          firstStep: number[];
          secondStep: true;
        }
      >
    >;
  });

  it("should return the scope of false case", () => {
    const condition = $if({ condition: Math.random() > 0.5 })
      .isTrue()

      .add("first step", () => Promise.resolve([1, 2, 3]))

      .add("second step", ($) => $.condition)

      .isFalse()

      .add("false step", () => ({ foo: "bar" }));

    const localScope = condition.get("false").scope.local;

    type A = typeof localScope;

    type localScope = Expect<
      Equal<
        A,
        {
          condition: false;
          falseStep: {
            foo: string;
          };
        }
      >
    >;
  });
});
