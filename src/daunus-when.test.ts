import { $when } from "./daunus-when"
import { type Expect, type Equal } from "./types-helpers"

describe("when", () => {
  it("should work without steps", async () => {
    const condition = $when({ condition: true })

    const { data } = await condition()

    type A = typeof data

    type data = Expect<Equal<A, boolean>>

    expect(data).toEqual(true)
  })

  it("should return value of condition", async () => {
    const condition = $when({ condition: true })
      .isTrue()

      .add("first step", ({ $ }) => $.condition)

    const { data } = await condition()

    type A = typeof data

    type data = Expect<Equal<A, boolean>>

    expect(data).toEqual(true)
  })

  it("should provide expected types for return", async () => {
    const condition = $when({ condition: false })
      .isTrue()

      .add("first step", ({ $ }) => $.condition)

      .add("second step", ({ $ }) => $.firstStep)

      .isFalse()

      .add("false step", () => ({ foo: "bar" }))

    const { data } = await condition()

    type A = typeof data

    type data = Expect<
      Equal<
        A,
        | true
        | {
            foo: string
          }
      >
    >

    expect(data).toEqual({ foo: "bar" })
  })

  it("should return the scope of true case", () => {
    const condition = $when({ condition: Math.random() > 0.5 })
      .isTrue()

      .add("first step", () => Promise.resolve([1, 2, 3]))

      .add("second step", ({ $ }) => $.condition)

      .isFalse()

      .add("false step", () => ({ foo: "bar" }))

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const localScope = condition.get("true").scope.local

    type A = typeof localScope

    type localScope = Expect<
      Equal<
        A,
        {
          condition: true
          firstStep: number[]
          secondStep: true
        }
      >
    >
  })

  it("should return the scope of false case", async () => {
    const condition = $when({ condition: Math.random() > 0.5 })
      .isTrue()

      .add("first step", () => Promise.resolve([1, 2, 3]))

      .add("second step", ({ $ }) => $.condition)

      .isFalse()

      .add("false step", ({ $ }) => $.condition)

      .add("false resukts", ({ $ }) => $)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data } = await condition()

    type A = typeof data

    type data = Expect<
      Equal<
        A,
        | true
        | {
            condition: false
            falseStep: false
          }
      >
    >
  })

  it("should return the scope of false case", () => {
    const condition = $when({ condition: Math.random() > 0.5 })
      .isTrue()

      .add("first step", () => Promise.resolve([1, 2, 3]))

      .add("second step", ({ $ }) => $.condition)

      .isFalse()

      .add("false step", () => ({ foo: "bar" }))

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const localScope = condition.get("false").scope.local

    type A = typeof localScope

    type localScope = Expect<
      Equal<
        A,
        {
          condition: false
          falseStep: {
            foo: string
          }
        }
      >
    >
  })
})
