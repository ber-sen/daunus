import { $iterate, type Item } from "./daunus-iterate"
import { type Expect, type Equal } from "./types-helpers"

describe("$iterate", () => {
  it("should provide expected types for return", async () => {
    const loop = $iterate({ list: ["A", 2, 3] })
      .forEachItem()

      .add("first step", ({ $ }) => $.item)

      .add("second step", ({ $ }) => $.firstStep.value)

    const { data } = await loop.run()

    type A = typeof data

    type data = Expect<Equal<A, (string | number)[]>>

    expect(data).toEqual(["A", 2, 3])
  })

  it("should work with range", async () => {
    const loop = $iterate({ range: 7 })
      .forEachItem()

      .add("first step", ({ $ }) => $.item)

      .add("second step", ({ $ }) => $.firstStep.value)

    const { data } = await loop.run()

    type A = typeof data

    type data = Expect<Equal<A, number[]>>

    expect(data).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it("should work with custom range", async () => {
    const loop = $iterate({ range: [1, 4] })
      .forEachItem()

      .add("first step", ({ $ }) => $.item)

      .add("second step", ({ $ }) => $.firstStep.value)

    const { data } = await loop.run()

    type A = typeof data

    type data = Expect<Equal<A, number[]>>

    expect(data).toEqual([1, 2, 3, 4])
  })

  it("should work with readonly list", async () => {
    const loop = $iterate({ list: ["A", "K"] as const })
      .forEachItem()

      .add("first step", ({ $ }) => $.item)

      .add("second step", ({ $ }) => $.firstStep.value)

    const { data } = await loop.run()

    type A = typeof data

    type data = Expect<Equal<A, ("A" | "K")[]>>

    expect(data).toEqual(["A", "K"])
  })

  it("should work with different item variable", async () => {
    const loop = $iterate({ list: [1, 2], itemVariable: "i" })
      .forEachItem()

      .add("first step", ({ $ }) => $.i.value)

    const { data } = await loop.run()

    type A = typeof data

    type data = Expect<Equal<A, number[]>>

    expect(data).toEqual([1, 2])
  })

  it("should work with parallel", async () => {
    const loop = $iterate({ list: [1, 2, 3] })
      .forEachItem({ stepsType: "parallel" })

      .add("first step", ({ $ }) => $.item)

      .add("second step", () => 42)

    const { data } = await loop.run()

    type A = typeof data

    type data = Expect<
      Equal<
        A,
        Array<{
          firstStep: {
            value: number
            index: number
          }
          secondStep: number
        }>
      >
    >

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
    ])
  })

  it("should retrun global for each step", () => {
    const loop = $iterate({ list: [1, 2], itemVariable: "i" })
      .forEachItem()

      .add("first step", ({ $ }) => $.i.value)

      .add("second step", () => 42)

    const stepsMap = loop.scope.stepsMap

    type T = typeof loop.scope.stepsMap

    type stepsMap = Expect<
      Equal<
        T,
        {
          firstStep: {
            i: Item<number[]>
          }
          secondStep: {
            i: Item<number[]>
            firstStep: number
          }
        }
      >
    >

    expect(stepsMap).not.toBeNull()
  })
})
