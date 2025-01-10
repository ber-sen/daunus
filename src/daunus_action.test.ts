import { DaunusException, DaunusInferReturn } from "./types"
import { z } from "./zod"
import { $action } from "./daunus_action"

type Expect<T extends true> = T

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false

describe("$action", () => {
  it("Should work with array", () => {
    const test = $action({ type: "test" }, () => (payload: string) => {
      if (Math.random() > 0.5) {
        return new DaunusException({ data: "Server Error" })
      }

      return [{ name: payload }]
    })("test")

    type A = DaunusInferReturn<typeof test>

    type test = Expect<
      Equal<
        A,
        {
          data: {
            name: string
          }[]
          exception: DaunusException<500, string>
        }
      >
    >
  })

  it("Should work with env", () => {
    const test = $action(
      {
        type: "test",
        envSchema: z.object({
          API_KEY: z.string()
        })
      },
      ({ env }) =>
        (_: string) => {
          return env.API_KEY
        }
    )("test")

    type A = DaunusInferReturn<typeof test>

    type test = Expect<
      Equal<
        A,
        {
          data: string
          exception: never
        }
      >
    >
  })

  it("Should work without env return", () => {
    const test = $action(
      {
        type: "test"
      },
      () => (_: string) => {
        return "test"
      }
    )

    type A = ReturnType<typeof test>["env"]

    type test = Expect<Equal<A, {}>>
  })

  it("Should work without env return", () => {
    const test = $action(
      {
        type: "user.app.snake_method",
        envSchema: z.object({ API_KEY: z.string() })
      },
      () => (_: string) => {
        return "test"
      }
    )

    type A = ReturnType<typeof test>["env"]

    type test = Expect<
      Equal<
        A,
        {
          API_KEY: string
        }
      >
    >
  })
})
