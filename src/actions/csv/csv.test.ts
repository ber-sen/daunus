import { $ctx, $delay, $stream } from "../.."
import csv from "."

describe("encode", () => {
  it("should with simple encode", async () => {
    const rows = $stream(async function* () {
      yield { name: "Alice", age: 30 }

      await $delay(500)

      yield { name: "Bob", age: 25 }
      yield { name: "Charlie", age: 35 }
    })

    const action = await csv({
      rows
    }).execute($ctx())

    expect(await new Response(action.data).text()).toStrictEqual(
      "name,age\r\nAlice,30\r\nBob,25\r\nCharlie,35"
    )
  })
})
