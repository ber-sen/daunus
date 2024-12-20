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

    expect(res.data).toStrictEqual({ test: { foo: "bar" }, test2: "test" });
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
          name: "test2",
          type: ["struct"],
          params: $query(($) => $.test.nested1)
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({
      test: { nested1: "action.1.1", nested2: "action.1.2" },
      test2: "action.1.1"
    });
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
          params: $query(($) => $.test)
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({
      test: { foo: "bar" },
      test2: { foo: "bar" }
    });
  });
});
