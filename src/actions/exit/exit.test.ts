import { Exception } from "../../daunus-exception"
import { type Equal, type Expect } from "../../types-helpers"

import exit from "./index"

describe("wait", () => {
  it("should work without data", async () => {
    const action = exit({
      status: 500
    })

    const res = await action.run()

    expect(res.exception).toBeInstanceOf(Exception)
    expect(res.exception).toHaveProperty("status", 500)

    type A = typeof res.exception

    type res = Expect<Equal<A, Exception<500, undefined>>>
  })

  it("should exit with message and status", async () => {
    const action = exit({
      status: 200,
      data: {
        success: true
      }
    })

    const res = await action.run()

    expect(res.exception).toBeInstanceOf(Exception)
    expect(res.exception).toHaveProperty("status", 200)

    type A = typeof res.exception

    type res = Expect<Equal<A, Exception<200, { success: boolean }>>>
  })
})
