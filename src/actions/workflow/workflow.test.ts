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
      },
      trigger: {
        name: "endpoint",
        type: ["endpoint"],
        params: { method: "post" }
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
            params: $query(($) => `Foo\n${$.csv.data}`)
          }
        ]
      },
      trigger: {
        name: "endpoint",
        type: ["endpoint"],
        params: { method: "post" }
      }
    });

    const res = await action.run($ctx());

    expect(res.data).toStrictEqual(
      "Foo\nhello,foo\r\nworld,bar\r\nworld 2,bar 2"
    );
  });
});
