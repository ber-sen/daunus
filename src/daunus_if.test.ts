import { $steps } from "./daunus_steps";

describe("$if", () => {
  it("should work with one step", async () => {
    const steps = $steps().add("first step", () => ({
      foo: "bar"
    }));

    expect(await steps.run()).toEqual({ foo: "bar" });
  });
});
