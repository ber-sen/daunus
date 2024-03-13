import { $ctx } from "../../daunus_helpers";
import { $var } from "../../daunus_var";
import struct from "../struct";
import exit from "../exit";

import condition from "./index";

describe("condition", () => {
  it("should work with error", async () => {
    const action = condition({
      if: $var(exit({ status: 403 })),
      else: $var(struct({ error: true }))
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({ error: true });
  });

  it("should work with truthy", async () => {
    const action = condition({
      if: $var(struct("Truthy")),
      do: $var(struct({ success: true }))
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({ success: true });
  });

  it("should work with falcy", async () => {
    const action = condition({
      if: $var(struct("")),
      else: $var(struct({ error: true }))
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({ error: true });
  });

  it("should work", async () => {
    const action = condition({
      if: true,
      do: $var(struct({ success: true }))
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({
      success: true
    });
  });
});
