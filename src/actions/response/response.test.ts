import task from "../task";

import { tineCtx } from "../../tine_helpers";
import { tineVar } from "../../tine_var";

import response from "./index";

describe("response", () => {
  it("should work for basic example", async () => {
    let i = 0;

    const claims = task(() => ({ userId: i++ }));

    const data = task(() => ({
      rows: ["test", "test", i++],
      userId: tineVar(claims, "userId")
    }));

    const action = response({
      before: tineVar(claims),
      data: tineVar(data)
    });

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual({ rows: ["test", "test", 1], userId: 0 });
  });
});
