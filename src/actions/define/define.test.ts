import { $ctx } from "../../daunus_helpers";
import define from "./index";

describe("define", () => {
  it("should work", async () => {
    const action = define({
      success: true
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({
      success: true
    });
  });
});
