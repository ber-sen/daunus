import { $ctx } from "../../daunus_helpers";
import { DaunusException } from "../../types";

import { $query } from "../..";
import steps from ".";

describe("steps", () => {
  it("should work for basic example", async () => {
    const action = steps({
      actions: [
        {
          name: "test",
          type: ["struct"],
          params: {
            foo: "bar"
          }
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({ foo: "bar" });
  });

  it("should work with query", async () => {
    const action = steps({
      actions: [
        {
          name: "test",
          type: ["struct"],
          params: {
            foo: "bar"
          }
        },
        {
          type: ["struct"],
          name: "test2",
          params: $query(($) => $.test.foo)
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual("bar");
  });

  it("should stop on error", async () => {
    const action = steps({
      actions: [
        {
          name: "test",
          type: ["struct"],
          params: {
            foo: "bar"
          }
        },
        {
          name: "error",
          type: ["exit"],
          params: {
            status: 404
          }
        },
        {
          name: "return",
          type: ["struct"],
          params: $query(($) => $.test.foo)
        }
      ]
    });

    const res = await action.run($ctx());

    expect(res.exception).toStrictEqual(new DaunusException(404));
  });

  it("should work with nested steps", async () => {
    const ctx = $ctx();

    const action = steps({
      actions: [
        {
          name: "test",
          type: ["steps"],
          params: {
            actions: [
              {
                type: ["struct"],
                params: "ipsum"
              },
              {
                type: ["struct"],
                params: {
                  foo: "bar"
                }
              }
            ]
          }
        },
        {
          type: ["struct"],
          name: "lorem",
          params: {
            foo: $query(($) => $.test.foo + "asd")
          }
        }
      ]
    });

    const res = await action.run(ctx);

    expect(res.data).toStrictEqual({ foo: "barasd" });
  });
});
