import { $actionWithInput } from "./daunus_action_with_input"
import { Exception } from "./daunus_exception"
import { type DaunusInferReturn } from "./types"
import { z } from "./zod"

type Expect<T extends true> = T

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false

describe("$actionWithInput", () => {
  it("Should work with array", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const test = $actionWithInput({ type: "test" }, () => (payload: string) => {
      if (Math.random() > 0.5) {
        return new Exception({ data: "Server Error" })
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
          exception: Exception<500, string>
        }
      >
    >
  })

  it("Should work with env", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const test = $actionWithInput(
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const test = $actionWithInput(
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const test = $actionWithInput(
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
