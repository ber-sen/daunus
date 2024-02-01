import { tineCtx } from "../../tine_helpers";
import { tineQuery } from "../../tine_query";

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
            params: tineQuery(($) => `Foo ${$.struct.data.name}`)
          }
        ]
      },
      trigger: {
        name: "endpoint",
        type: ["endpoint"],
        params: { method: "post" }
      }
    });

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual("Foo Bar");
  });
});
