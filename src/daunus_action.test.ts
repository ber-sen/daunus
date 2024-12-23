import { $input } from "./daunus_helpers"
import { struct } from "./actions"
import { DaunusException, DaunusInferInput, DaunusInferReturn } from "./types"
import { z } from "./zod"
import { $action } from "./daunus_action"
import { $query } from "."

type Expect<T extends true> = T

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false

describe("$action", () => {
  it("Should infer input", () => {
    const input = $input({
      id: z.string()
    }).openapi("User")

    const test = struct({ success: true, data: $query(($) => $.input.id) })

    const res = test.createRoute(input)

    type A = DaunusInferInput<typeof res>

    type test = Expect<Equal<A, { id: string }>>
  })

  it("Should infer return", () => {
    const input = $input({
      id: z.string()
    }).openapi("User")

    const test = struct({ success: true, data: $query(($) => $.id as string) })

    const res = test.createRoute(input)

    type A = DaunusInferReturn<typeof res>

    type test = Expect<
      Equal<A, { data: { success: boolean; data: string }; exception: never }>
    >
  })

  it("Should return api props", () => {
    const input = $input({
      path: z.object({ id: z.string() })
    }).openapi("User")

    const test = struct({ success: true, data: $query(($) => $.path.id) })

    const res = test.createRoute(input)

    expect(JSON.stringify(res.meta.openapi)).toEqual(
      '{"method":"post","contentType":"application/json","path":"<% path %>"}'
    )
  })

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

    type A = z.infer<NonNullable<ReturnType<typeof test>["envSchema"]>>

    // eslint-disable-next-line @typescript-eslint/ban-types
    type test = Expect<Equal<A, {}>>
  })

  it("Should populate openapi by when struct matches", () => {
    const input = $input({
      method: z.literal("post"),
      contentType: z.literal("json"),
      body: z.object({ id: z.string() }),
      query: z.object({ sj: z.string() })
    })

    const test = struct({ success: true, data: $query(($) => $.body.id) })

    const res = test.createRoute(input)

    expect(JSON.stringify(res.meta.openapi)).toEqual(
      '{"method":"<% method %>","contentType":"<% contentType %>","body":"<% body %>","query":"<% query %>"}'
    )

    type A = typeof res.meta.openapi

    type test = Expect<
      Equal<
        A,
        {
          method: "post"
          contentType: "json"
          path: unknown
          body: {
            id: string
          }
          query: {
            sj: string
          }
        }
      >
    >
  })

  it("Should work with create route", async () => {
    const test = struct({ success: true }).createRoute()

    const { data } = await test.run()

    expect(data).toEqual({ success: true })

    type A = typeof data

    type test = Expect<Equal<A, { success: boolean }>>
  })

  it("Should pass meta", () => {
    const action = $action(
      { type: "foo", meta: { foo: "baz" } },
      () => (params: string) => {
        return params
      }
    )("")

    expect(action.actionMeta).toEqual({ foo: "baz" })
  })
})
