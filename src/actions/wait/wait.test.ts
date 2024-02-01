import { tineCtx } from "../../tine_helpers";
import { Wait } from "../../types";

import wait from "./index";

describe("wait", () => {
  it("should work throw wait exeption", async () => {
    const action = wait({
      delay: "1d"
    });

    const res = await action.run(tineCtx());

    expect(res.error).toStrictEqual(new Wait({ delay: "1d" }));
  });
});
