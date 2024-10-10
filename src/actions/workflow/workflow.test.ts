import { $ctx } from "../../daunus_helpers";
import { $query } from "../../daunus_query";

import workflow from "./index";

describe("workflow", () => {
  it("should work for basic example", async () => {
    const action = workflow({
      name: "Foo",
      action: {
        type: ["process"],
        params: [
          {
            name: "struct",
            type: ["struct"],
            params: { name: "Bar" }
          },
          {
            type: ["struct"],
            params: $query(($) => `Foo ${$.struct.data.name}`)
          }
        ]
      }
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual("Foo Bar");
  });

  it("should work with streams", async () => {
    const action = workflow({
      name: "Foo",
      action: {
        type: ["process"],
        params: [
          {
            name: "csv",
            type: ["csv"],
            params: {
              rows: [
                { hello: "world", foo: "bar" },
                { hello: "world 2", foo: "bar 2" }
              ]
            }
          },
          {
            type: ["struct"],
            params: $query(
              async ($) => `Foo\n${await new Response($.csv.data).text()}`
            )
          }
        ]
      }
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual(
      "Foo\nhello,foo\r\nworld,bar\r\nworld 2,bar 2"
    );
  });

  it("should work with condition", async () => {
    const action = workflow({
      name: "Foo",
      action: {
        type: ["process"],
        params: [
          {
            name: "item",
            type: ["struct"],
            params: { name: "Foo" }
          },
          {
            name: "res",
            type: ["condition"],
            params: {
              if: $query(($) => $.item.data.name === "Foo"),
              do: {
                name: "item2",
                type: ["process"],
                params: [
                  {
                    name: "item3",
                    type: ["struct"],
                    params: { success: true }
                  }
                ]
              }
            }
          }
        ]
      }
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual({ success: true });
  });
});
