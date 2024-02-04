import { Equal, Expect, TineError } from "../../types";

import exit from "./index";

describe("wait", () => {
  it("should exit with message and status", async () => {
    const action = exit({
      status: 403,
      message: "Forbidden"
    });

    const res = await action.run();

    expect(res.error).toBeInstanceOf(TineError);
    expect(res.error).toHaveProperty("message", "Forbidden");
    expect(res.error).toHaveProperty("status", 403);

    type A = typeof res.error;

    type res = Expect<Equal<A, TineError<403, unknown>>>;
  });
});
