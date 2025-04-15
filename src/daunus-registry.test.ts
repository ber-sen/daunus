import { struct } from "."
import { $registry } from "./daunus-registry"

import { type Expect, type Equal } from "./types-helpers"

describe("$registry", () => {
  it("should be able to add factories and create actions", async () => {
    const actions = $registry().add("struct", struct)

    const action = actions("struct")({ name: "Foo" })

    const { data } = await action()

    type A = typeof data

    type data = Expect<
      Equal<
        A,
        {
          name: string
        }
      >
    >

    expect(data).toEqual({ name: "Foo" })
  })
})
