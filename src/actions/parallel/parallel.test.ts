import { tineCtx } from "../../tine_helpers";

import parallel from "./index";

describe("parallel", () => {
  it("should work with two actions", async () => {
    const action = parallel([
      {
        name: "test",
        type: ["struct"],
        params: {
          foo: "bar"
        }
      },
      {
        type: ["struct"],
        params: "test"
      }
    ]);

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual([{ foo: "bar" }, "test"]);
  });

  it("should work with with nested parallel", async () => {
    const action = parallel([
      {
        name: "test",
        type: ["parallel"],
        params: [
          {
            type: ["struct"],
            params: "action.1.1"
          },
          {
            type: ["struct"],
            params: "action.1.2"
          }
        ]
      },
      {
        type: ["struct"],
        params: "action.2"
      }
    ]);

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual([["action.1.1", "action.1.2"], "action.2"]);
  });

  it("should NOT be able to access return of the first action from the second", async () => {
    const action = parallel([
      {
        name: "test",
        type: ["struct"],
        params: {
          foo: "bar"
        }
      },
      {
        type: ["struct"],
        params: "{{ $.test.data }}"
      }
    ]);

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual([{ foo: "bar" }, undefined]);
  });
});
