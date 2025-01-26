import { struct } from "."
import { $actions } from "./daunus_actions"
import { type Expect, type Equal } from "./types_helpers"

describe("$actions", () => {
  it("should be able to add factories and create actions", async () => {
    const actions = $actions().add("struct", struct)

    const action = actions("struct")({ name: "Foo" })

    const { data } = await action.run()

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
