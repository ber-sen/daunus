import { $ctx } from "../../daunus-helpers"
import struct from "./index"

describe("struct", () => {
  it("should work", async () => {
    const action = struct({
      success: true
    })

    const res = await action($ctx())

    expect(res.data).toStrictEqual({
      success: true
    })
  })
})
