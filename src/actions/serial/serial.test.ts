import { $query } from "../..";
import { $ctx } from "../../daunus_helpers";

import serial from "./index";

describe("serial", () => {
  it("should work with two actions", async () => {
    const action = serial({
      actions: [
        {
          name: "test",
          type: ["struct"],
          params: {
            foo: "bar"
          }
        },
        {
          name: "test2",
          type: ["struct"],
          params: "test"
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual([{ foo: "bar" }, "test"]);
  });

  it("should work with with nested serial", async () => {
    const action = serial({
      actions: [
        {
          name: "test",
          type: ["serial"],
          params: {
            actions: [
              {
                type: ["struct"],
                params: "action.1.1"
              },
              {
                type: ["struct"],
                params: "action.1.2"
              }
            ]
          }
        },
        {
          name: "test2",
          type: ["struct"],
          params: "action.2"
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual([["action.1.1", "action.1.2"], "action.2"]);
  });

  it("should be able to access return of the first action from the second", async () => {
    const action = serial({
      actions: [
        {
          name: "test",
          type: ["struct"],
          params: {
            foo: "bar"
          }
        },
        {
          name: "test2",
          type: ["struct"],
          params: $query(($) => $.test.data)
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual([{ foo: "bar" }, { foo: "bar" }]);
  });
});
