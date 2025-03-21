import { resolveParams } from "./resolve-params"
import { $query } from "./daunus-query"

const setContext = (value: object) => {
  const ctx = new Map()

  ctx.set("input", value)

  return ctx
}

describe("$query", () => {
  it("should return the value", async () => {
    const ctx = setContext({ name: "Earth" })

    const res = await resolveParams(
      ctx,
      $query(($) => $.input.name)
    )

    expect(res).toStrictEqual("Earth")
  })
})
