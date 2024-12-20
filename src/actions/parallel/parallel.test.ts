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

    expect(res.data).toStrictEqual({ lorem: undefined, test: undefined });
    expect(res.exception).toEqual(
      new DaunusException({
        paths: {
          test: new DaunusException(),
          lorem: new DaunusException({ status: 400, data: "test" })
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

    expect(res.data).toStrictEqual({
      test: { success: true },
      lorem: undefined
    });
    expect(res.exception).toEqual(
      new DaunusException({
        paths: {
          lorem: new DaunusException({ status: 400, data: "test" })
        }
      })
    );
  });

  it("should return data and exceptions when some failed in nested parallels", async () => {
    const action = parallel({
      actions: [
        {
          name: "main1",
          type: ["struct"],
          params: {
            success: true
          }
        },
        {
          name: "main2",
          type: ["parallel"],
          params: {
            actions: [
              {
                name: "sub1",
                type: ["struct"],
                params: {
                  success: true
                }
              },
              {
                name: "sub2",
                type: ["exit"],
                params: {
                  status: 500
                }
              }
            ]
          }
        },
        {
          name: "main3",
          type: ["exit"],
          params: {
            status: 400,
            data: "test"
          }
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({
      main1: { success: true },
      main2: { sub1: { success: true }, sub2: undefined },
      main3: undefined
    });
    expect(res.exception).toEqual(
      new DaunusException({
        paths: {
          main2: new DaunusException({
            paths: {
              sub2: new DaunusException()
            }
          }),
          main3: new DaunusException({
            data: "test",
            status: 400
          })
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
