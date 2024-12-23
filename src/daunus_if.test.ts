import { $if } from "./daunus_if"
import { Expect, Equal } from "./type_helpers"

describe("$if", () => {
  it("should work without steps", async () => {
    const condition = $if({ condition: true })

    const data = await condition.run()

    type A = typeof data

    type data = Expect<Equal<A, boolean>>

    expect(data).toEqual(true)
  })

  it("should return value of condition", async () => {
    const condition = $if({ condition: true })
      .isTrue()

      .add("first step", ({ $ }) => $.condition)

    const data = await condition.run()

    type A = typeof data

    type data = Expect<Equal<A, boolean>>

    expect(data).toEqual(true)
  })

  it("should provide expected types for return", async () => {
    const condition = $if({ condition: false })
      .isTrue()

      .add("first step", ({ $ }) => $.condition)

      .add("second step", ({ $ }) => $.firstStep)

      .isFalse()

      .add("false step", () => ({ foo: "bar" }))

    const data = await condition.run()

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
    const condition = $if({ condition: Math.random() > 0.5 })
      .isTrue()

      .add("first step", () => Promise.resolve([1, 2, 3]))

      .add("second step", ({ $ }) => $.condition)

      .isFalse()

      .add("false step", () => ({ foo: "bar" }))

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

  it("should return the scope of false case", () => {
    const condition = $if({ condition: Math.random() > 0.5 })
      .isTrue()

      .add("first step", () => Promise.resolve([1, 2, 3]))

      .add("second step", ({ $ }) => $.condition)

      .isFalse()

      .add("false step", () => ({ foo: "bar" }))

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
