import { $query } from "../..";
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

    expect(res.data).toStrictEqual([{ foo: "bar" }, "test"]);
  });

  it("should return exeption", async () => {
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
          type: ["struct"],
          params: "test"
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual(undefined);
    expect(res.exception).toEqual({ status: 500 });
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
          type: ["struct"],
          params: "action.2"
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual([["action.1.1", "action.1.2"], "action.2"]);
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

    expect(res.data).toStrictEqual([{ foo: "bar" }, undefined]);
  });
});
