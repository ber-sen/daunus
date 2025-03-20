import { $query } from "../.."
import { $ctx } from "../../daunus-helpers"

import loop from "./index"

describe("loop", () => {
  it("should work for basic example", async () => {
    const action = loop(
      {
        list: [1, 2],
        itemName: "item",
        action: {
          name: "iterate",
          type: ["struct"],
          params: $query(($) => $.item.value as number)
        }
      },
      { name: "items" }
    )

    const res = await action.execute($ctx())

    expect(res.data).toStrictEqual([1, 2])
  })
})
