import { $httpInput } from "./daunus-helpers"

import { type Expect, type Equal } from "./types-helpers"
import { z } from "./zod"

describe("$httpInput", () => {
  it("should add http type", async () => {
    const input = $httpInput({ name: z.string() })

    const result = input.parse({ name: "Luna" })

    type A = z.infer<typeof input>

    type result = Expect<
      Equal<
        A,
        {
          __type: "http"
          name: string
        }
      >
    >

    expect(result).toEqual({ __type: "http", name: "Luna" })
  })
})
