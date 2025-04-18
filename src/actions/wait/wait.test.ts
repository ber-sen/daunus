import { Wait } from "../.."
import { $ctx } from "../../daunus-helpers"

import wait from "./index"

describe("wait", () => {
  it("should work throw wait Exception", async () => {
    const action = wait({
      delay: "1d"
    })

    const res = await action($ctx())

    expect(res.exception).toStrictEqual(new Wait({ delay: "1d" }))
  })
})
