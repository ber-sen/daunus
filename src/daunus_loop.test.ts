import { $loop } from "./daunus_loop";
import { Expect, Equal } from "./type_helpers";

describe("$loop", () => {
  it("should provide expected types for return", () => {
    const loop = $loop({ list: [1, 2, 3] })
      .forEachItem()

      .add("first step", ($) => $.item)

      .add("second step", ($) => $.firstStep.value);

    const data = loop.run();

    type A = typeof data;

    type data = Expect<Equal<A, Promise<number[]>>>;

    expect(data).toEqual([1, 2, 3]);
  });

  it("should work with parallel", () => {
    const loop = $loop({ list: [1, 2, 3] })
      .forEachItem({ stepsType: "parallel" })

      .add("first step", ($) => $.item)

      .add("second step", () => 42);

    const data = loop.run();

    type A = typeof data;

    type data = Expect<
      Equal<
        A,
        Array<{
          firstStep: {
            value: number;
            index: number;
          };
          secondStep: number;
        }>
      >
    >;
  });
});
