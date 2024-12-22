import { z } from "zod";
import { $useCase } from "./daunus_use_case";
import { Expect, Equal } from "./type_helpers";
import { $if, $input, $loop } from ".";

describe("$route", () => {
  it("show work without input", async () => {
    const useCase = $useCase().handle(() => "Hello world");

    const data = await useCase.run();

    type A = typeof data;

    type data = Expect<Equal<A, string>>;

    expect(data).toEqual("Hello world");
  });

  it("show work for single step", async () => {
    const input = $input({ name: z.string() });

    const useCase = $useCase({ input }).handle(($) => $.input.name === "lorem");

    const data = await useCase.run({ name: "lorem" });

    type A = typeof data;

    type data = Expect<Equal<A, boolean>>;

    expect(data).toEqual(true);
  });

  it("should provide expected types for return", async () => {
    const input = $input({ name: z.string() });

    const route = $useCase({ input })
      .steps()

      .add("first step", ($) => $.input)

      .add("second step", ($) => $.firstStep.name);

    const data = await route.run({ name: "Luna" });

    type A = typeof data;

    type data = Expect<Equal<A, string>>;

    expect(data).toEqual("Luna");
  });

  it("should work with parallel steps", async () => {
    const input = $input({ city: z.string() });

    const route = $useCase({ input })
      .steps({ stepsType: "parallel" })

      .add("first step", ($) => $.input)

      .add("second step", () => 42);

    const data = await route.run({ city: "London" });

    type A = typeof data;

    type data = Expect<
      Equal<
        A,
        {
          firstStep: {
            city: string;
          };
          secondStep: number;
        }
      >
    >;

    expect(data).toEqual({
      firstStep: {
        city: "London"
      },
      secondStep: 42
    });
  });

  it("show work with loop and condition", async () => {
    const input = $input({ names: z.array(z.number()) });

    const useCase = $useCase({ input }).handle(($) =>
      $loop({ list: $.input.names, $ })
        .forEachItem()

        .add("module", ($) => $.item.value % 2)

        .add("check", ($) =>
          $if({ condition: $.module === 0, $ })
            .isTrue()

            .add("even", ($) => `${$.item.value} is even`)

            .isFalse()

            .add("odd", ($) => $.item.value)
        )
    );

    const data = await useCase.run({ names: [1, 2, 3] });

    type A = typeof data;

    type data = Expect<Equal<A, (string | number)[]>>;

    expect(data).toEqual([1, "2 is even", 3]);
  });
});
