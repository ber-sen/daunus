import { z } from "zod";
import { $route } from "./daunus_route";
import { Expect, Equal } from "./type_helpers";
import { $input } from ".";

describe("$route", () => {
  it("show work for single step", () => {
    const input = $input({ name: z.string() });

    const route = $route({ input }).handle(($) => $.input.name === "lorem");

    const data = route.run({ name: "lorem" });

    type A = typeof data;

    type data = Expect<Equal<A, Promise<boolean>>>;
  });

  it("should provide expected types for return", () => {
    const input = $input({ name: z.string() });

    const route = $route({ input })
      .steps()

      .add("first step", ($) => $.input)

      .add("second step", ($) => $.firstStep.name);

    const data = route.run({ name: "asd" });

    type A = typeof data;

    type data = Expect<Equal<A, Promise<string>>>;
  });
});
