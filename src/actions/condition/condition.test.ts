import { $ctx } from "../../daunus_helpers";


import condition from "./index";

describe("condition", () => {
  it("should work with error", async () => {
    const action = condition({
      if: {
        type: ["exit"],
        params: {
          status: 403
        }
      },
      else: {
        error: true
      }
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({ error: true });
  });

  it("should work with truthy", async () => {
    const action = condition({
      if: "Truthy",
      do: { success: true }
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({ success: true });
  });

  it("should work with falcy", async () => {
    const action = condition({
      if: "",
      else: { error: true }
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({ error: true });
  });

  it("should work", async () => {
    const action = condition({
      if: true,
      do: { success: true }
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({
      success: true
    });
  });
});
