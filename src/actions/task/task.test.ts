import { tineCtx } from "../../tine_helpers";
import task from "./index";

describe("task", () => {
  it("should work", async () => {
    const action = task(() => ({
      success: true
    }));

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual({
      success: true
    });
  });

  it("should work with promise", async () => {
    const action = task(() =>
      Promise.resolve({
        success: true
      })
    );

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual({
      success: true
    });
  });
});
