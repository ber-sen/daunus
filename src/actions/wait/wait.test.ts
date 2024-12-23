import { $ctx } from "../../daunus_helpers"
import { Wait } from "../../types"

import wait from "./index"

describe("wait", () => {
  it("should work throw wait Exception", async () => {
    const action = wait({
      delay: "1d"
    })

    const res = await action.run($ctx())

    expect(res.exception).toStrictEqual(new Wait({ delay: "1d" }))
  })
})
