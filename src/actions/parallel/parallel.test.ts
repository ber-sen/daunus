import { $query, DaunusException } from "../..";
import { $ctx } from "../../daunus_helpers";

import parallel from "./index";

describe("parallel", () => {
  it("should work with two actions", async () => {
    const action = parallel({
      actions: [
        {
          name: "sub1",
          type: ["struct"],
          params: {
            foo: "bar"
          }
        },
        {
          name: "sub2",
          type: ["struct"],
          params: "test"
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({ sub1: { foo: "bar" }, sub2: "test" });
  });

  it("should return exceptions when all failed", async () => {
    const action = parallel({
      actions: [
        {
          name: "test",
          type: ["exit"],
          params: {
            status: 500
          }
        },
        {
          name: "lorem",
          type: ["exit"],
          params: {
            status: 400,
            data: "test"
          }
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual(undefined);
    expect(res.exception).toEqual(
      new DaunusException(500, {
        paths: {
          test: new DaunusException(500),
          lorem: new DaunusException(400, { data: "test" })
        }
      })
    );
  });

  it("should return data and exceptions when some failed", async () => {
    const action = parallel({
      actions: [
        {
          name: "test",
          type: ["struct"],
          params: {
            success: true
          }
        },
        {
          name: "lorem",
          type: ["exit"],
          params: {
            status: 400,
            data: "test"
          }
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({ test: { success: true } });
    expect(res.exception).toEqual(
      new DaunusException(500, {
        paths: {
          lorem: new DaunusException(400, { data: "test" })
        }
      })
    );
  });

  it("should work with with nested parallel", async () => {
    const action = parallel({
      actions: [
        {
          name: "test",
          type: ["parallel"],
          params: {
            actions: [
              {
                name: "nested1",
                type: ["struct"],
                params: "action.1.1"
              },
              {
                name: "nested2",
                type: ["struct"],
                params: "action.1.2"
              }
            ]
          }
        },
        {
          name: "sub2",
          type: ["struct"],
          params: "action.2"
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({
      test: { nested1: "action.1.1", nested2: "action.1.2" },
      sub2: "action.2"
    });
  });

  it("should NOT be able to access return of the first action from the second", async () => {
    const action = parallel({
      actions: [
        {
          name: "sub1",
          type: ["struct"],
          params: {
            foo: "bar"
          }
        },
        {
          name: "sub2",
          type: ["struct"],
          params: $query(($) => $?.test?.data)
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({ sub1: { foo: "bar" }, sub2: undefined });
  });
});
