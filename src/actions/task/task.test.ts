import { $ctx } from "../../daunus_helpers";
import task from "./index";

describe("task", () => {
  it("should work", async () => {
    const action = task(() => ({
      success: true
    }));

    const res = await action.run($ctx());

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

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({
      success: true
    });
  });
});
