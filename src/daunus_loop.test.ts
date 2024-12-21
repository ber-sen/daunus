import { $loop } from "./daunus_loop";
import { Expect, Equal } from "./type_helpers";

describe("$loop", () => {
  it("should provide expected types for return", async () => {
    const loop = $loop({ list: [1, 2, 3] })
      .forEachItem()

      .add("first step", ($) => $.item)

      .add("second step", ($) => $.firstStep.value);

    const data = await loop.run();

    type A = typeof data;

    type data = Expect<Equal<A, number[]>>;

    expect(data).toEqual([1, 2, 3]);
  });

  it("should work with different item variable", async () => {
    const loop = $loop({ list: [1, 2], itemVariable: "i" })
      .forEachItem()

      .add("first step", ($) => $.i.value);

    const data = await loop.run();

    type A = typeof data;

    type data = Expect<Equal<A, number[]>>;

    expect(data).toEqual([1, 2]);
  });

  it("should work with parallel", async () => {
    const loop = $loop({ list: [1, 2, 3] })
      .forEachItem({ stepsType: "parallel" })

      .add("first step", ($) => $.item)

      .add("second step", () => 42);

    const data = await loop.run();

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

    expect(data).toEqual([
      {
        firstStep: {
          index: 0,
          value: 1
        },
        secondStep: 42
      },
      {
        firstStep: {
          index: 1,
          value: 2
        },
        secondStep: 42
      },
      {
        firstStep: {
          index: 2,
          value: 3
        },
        secondStep: 42
      }
    ]);
  });
});
