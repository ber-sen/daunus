import { tineCtx } from "../../tine_helpers";
import { TineError } from "../../types";

import exit from "./index";

describe("wait", () => {
  it("should exit with message and status", async () => {
    const action = exit({
      status: 403,
      message: "Forbidden"
    });

    const res = await action.run(tineCtx());

    expect(res.error).toBeInstanceOf(TineError);
    expect(res.error).toHaveProperty("message", "Forbidden");
    expect(res.error).toHaveProperty("status", 403);
  });
});
