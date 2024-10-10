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
            name: "file",
            type: ["struct"],
            params: new ReadableStream({
              start(controller) {
                controller.enqueue({ name: "Alice", age: 30 });
                controller.enqueue({ name: "Bob", age: 25 });
                controller.enqueue({ name: "Charlie", age: 35 });
                controller.close();
              }
            })
          },
          {
            name: "csv",
            type: ["csv"],
            params: {
              rows: $query(($) => $.file.data)
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
      "Foo\nname,age\r\nAlice,30\r\nBob,25\r\nCharlie,35"
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
