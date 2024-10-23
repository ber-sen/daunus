import { $steps, FormatScope } from "./daunus_steps";
import { Equal, Expect } from "./types";

describe("$steps", () => {
  it("should convert keys to cammel case", () => {
    const steps = $steps()
      .add("first step", () => ({
        foo: "bar"
      }))
      .add("second step", ($) => $.firstStep.foo);

    type A = typeof steps.scope.local;

    type steps = Expect<
      Equal<
        A,
        {
          firstStep: {
            foo: string;
          };
          secondStep: string;
        }
      >
    >;
  });

  it("should return the return value of last key by default", () => {
    const steps = $steps()
      .add("first step", () => ({
        foo: "bar"
      }))
      .add("second step", ($) => $.firstStep.foo);

    expect(steps.run()).toEqual("bar");
  });

  it("should return the return value of last key by default in nested", () => {
    const steps = $steps()
      .add("nested", ($) =>
        $steps($)
          .add("first step", () => ({
            foo: "bar"
          }))
          .add("second step", ($) => $.firstStep.foo)
      )
      .add("return", ($) => $.nested);

    expect(steps.run()).toEqual("bar");
  });
});
