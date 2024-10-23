import { $steps } from "./daunus_steps";

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

  it("should work with one step", () => {
    const steps = $steps().add("first step", () => ({
      foo: "bar"
    }));

    expect(steps.run()).toEqual({ foo: "bar" });
  });

  it("should return the return value of last key by default", () => {
    const steps = $steps()
      .add("first step", () => ({
        foo: "bar"
      }))

      .add("second step", ($) => $);

    expect(steps.run()).toEqual({ firstStep: { foo: "bar" } });
  });

  it("should return the return value of last key by default in nested", () => {
    const steps = $steps()
      .add("nested", ($) =>
        $steps($)
          .add("nested", () => ({
            foo: "bar"
          }))

          .add("second step", ($) => $.nested.foo)
      )

      .add("return", ($) => $.nested);

    expect(steps.run()).toEqual("bar");
  });

  it("should display proper types for parallel ", () => {
    const steps = $steps()
      .add("input", () => [1, 2, 3] as const)

      .add("parallel", ($) =>
        $steps($)
          .setOptions({ type: "parallel" })

          .add("first step", () => ({
            foo: "bar"
          }))

          .add("second step", ($) => $)
      )
      .add("return", ($) => $.parallel);

    type A = ReturnType<(typeof steps)["run"]>;

    type steps = Expect<
      Equal<
        A,
        {
          firstStep: {
            foo: string;
          };
          secondStep: {
            input: readonly [1, 2, 3];
          };
        }
      >
    >;
  });

  it("should return the all values if type is parallel", () => {
    const steps = $steps()
      .add("input", () => [1, 2, 3])

      .add("parallel", ($) =>
        $steps($)
          .setOptions({ type: "parallel" })

          .add("first step", () => ({
            foo: "bar"
          }))

          .add("second step", ($) => $.input)
      )

      .add("return", ($) => $.parallel);

    expect(steps.run()).toEqual({
      firstStep: { foo: "bar" },
      secondStep: [1, 2, 3]
    });
  });

  it("should work with nested steps inside parallel", () => {
    const steps = $steps()
      .add("input", () => [1, 2, 3])

      .add("parallel", ($) =>
        $steps($)
          .setOptions({ type: "parallel" })

          .add("first step", () => ({
            foo: "bar"
          }))

          .add("second step", ($) =>
            $steps($)
              .add("nested", () => ({
                foo: $.input
              }))

              .add("second step", ($) => $.nested.foo)
          )
      )

      .add("return", ($) => $.parallel);

    expect(steps.run()).toEqual({
      firstStep: { foo: "bar" },
      secondStep: [1, 2, 3]
    });
  });
});
