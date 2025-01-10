import { $ctx } from "../../daunus_helpers"
import struct from "./index"

describe("struct", () => {
  it("should work", async () => {
    const action = struct({
      success: true
    })

    const res = await action.run($ctx())

    expect(res.data).toStrictEqual({
      success: true
    })
  })
})
