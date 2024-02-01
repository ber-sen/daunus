import { tineCtx } from "../../tine_helpers";
import { tineVar } from "../../tine_var";
import struct from "../struct";
import exit from "../exit";

import condition from "./index";

describe("condition", () => {
  it("should work with error", async () => {
    const action = condition({
      if: tineVar(exit({ status: 403 })),
      else: tineVar(struct({ error: true }))
    });

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual({ error: true });
  });

  it("should work with truthy", async () => {
    const action = condition({
      if: tineVar(struct("Truthy")),
      do: tineVar(struct({ success: true }))
    });

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual({ success: true });
  });

  it("should work with falcy", async () => {
    const action = condition({
      if: tineVar(struct("")),
      else: tineVar(struct({ error: true }))
    });

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual({ error: true });
  });

  it("should work", async () => {
    const action = condition({
      if: true,
      do: tineVar(struct({ success: true }))
    });

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual({
      success: true
    });
  });
});
