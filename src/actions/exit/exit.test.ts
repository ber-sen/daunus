import { Equal, Expect, DaunusException } from "../../types";

import exit from "./index";

describe("wait", () => {
  it("should exit with message and status", async () => {
    const action = exit({
      status: 200,
      data: {
        success: true
      }
    });

    const res = await action.run();

    expect(res.exception).toBeInstanceOf(DaunusException);
    expect(res.exception).toHaveProperty("status", 200);

    type A = typeof res.exception;

    type res = Expect<Equal<A, DaunusException<200, { success: boolean }>>>;
  });
});
