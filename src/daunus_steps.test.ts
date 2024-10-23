import { $steps } from "./daunus_steps";

describe("$steps", () => {
  it("should convert keys to cammel case", () => {
    const steps = $steps()
      .add("first step", () => ({
        foo: "bar"
      }))
      .add("second step", ($) => $.firstStep.foo);

    expect(steps.scope.local).toEqual({
      firstStep: {
        foo: "bar"
      },
      secondStep: "bar"
    });

    expect(steps.get("second step")).toEqual("bar");
  });
});
