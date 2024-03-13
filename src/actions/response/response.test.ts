import task from "../task";

import { $ctx } from "../../daunus_helpers";
import { $var } from "../../daunus_var";

import response from "./index";

describe("response", () => {
  it("should work for basic example", async () => {
    let i = 0;

    const claims = task(() => ({ userId: i++ }));

    const data = task(() => ({
      rows: ["test", "test", i++],
      userId: $var(claims, "userId")
    }));

    const action = response({
      before: $var(claims),
      data: $var(data)
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({ rows: ["test", "test", 1], userId: 0 });
  });
});
