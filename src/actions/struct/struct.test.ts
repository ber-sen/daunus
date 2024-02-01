import { tineCtx } from "../../tine_helpers";
import struct from "./index";

describe("struct", () => {
  it("should work", async () => {
    const action = struct({
      success: true
    });

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual({
      success: true
    });
  });
});
