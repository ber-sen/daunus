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

  it("should work with one step", async () => {
    const steps = $steps().add("first step", () => ({
      foo: "bar"
    }));

    expect(await steps.run()).toEqual({ foo: "bar" });
  });

  it("should return the return value of last key by default", async () => {
    const steps = $steps()
      .add("first step", () => ({
        foo: "bar"
      }))

      .add("second step", ($) => $);

    expect(await steps.run()).toEqual({ firstStep: { foo: "bar" } });
  });

  it("should return the return value of last key by default in nested", async () => {
    const steps = $steps()
      .add("nested", ($) =>
        $steps($)
          .add("nested", () => ({
            foo: "bar"
          }))

          .add("second step", ($) => $.nested.foo)
      )

      .add("return", ($) => $.nested);

    expect(await steps.run()).toEqual("bar");
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

    type A = Awaited<ReturnType<(typeof steps)["run"]>>;

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

  it("should return the all values if type is parallel", async () => {
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

    expect(await steps.run()).toEqual({
      firstStep: { foo: "bar" },
      secondStep: [1, 2, 3]
    });
  });

  it("should work with nested steps inside parallel", async () => {
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

    expect(await steps.run()).toEqual({
      firstStep: { foo: "bar" },
      secondStep: [1, 2, 3]
    });
  });

  it("should resolve promises", async () => {
    const steps = $steps()
      .add("nested", ($) =>
        $steps($)
          .add("nested", () =>
            Promise.resolve({
              foo: "bar"
            })
          )

          .add("second step", ($) => $.nested.foo)
      )

      .add("return", ($) => $.nested);

    expect(await steps.run()).toEqual("bar");
  });

  it("should resolve nested values inside promuse ", async () => {
    const steps = $steps()
      .add("nested", ($) =>
        $steps($)
          .add("sub", ($) =>
            Promise.resolve($steps($).add("sub", () => [1, 2, 3]))
          )

          .add("second step", ($) => $.sub)
      )

      .add("return", ($) => $.nested);

    expect(await steps.run()).toEqual([1, 2, 3]);
  });

  it("should resolve promises in parallel", async () => {
    const steps = $steps()
      .add("input", () => Promise.resolve([1, 2, 3]))

      .add("parallel", ($) =>
        $steps($)
          .setOptions({ type: "parallel" })

          .add("first step", () =>
            Promise.resolve({
              foo: "bar"
            })
          )

          .add("second step", ($) =>
            Promise.resolve(
              $steps($)
                .add("nested", () =>
                  Promise.resolve({
                    foo: $.input
                  })
                )

                .add("second step", ($) => $.nested.foo)
            )
          )
      )

      .add("return", ($) => $.parallel);

    expect(await steps.run()).toEqual({
      firstStep: { foo: "bar" },
      secondStep: [1, 2, 3]
    });
  });
});
