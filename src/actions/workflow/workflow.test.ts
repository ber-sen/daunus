import { Exception } from "../../daunus_exception"
import { $ctx, $delay, $stream } from "../../daunus_helpers"
import { $query } from "../../daunus_query"

import workflow from "./index"

describe("workflow", () => {
  it("should work for basic example", async () => {
    const action = workflow({
      name: "Foo",
      action: {
        type: ["steps"],
        params: {
          actions: [
            {
              name: "struct",
              type: ["struct"],
              params: { name: "Bar" }
            },
            {
              type: ["struct"],
              params: $query(($) => `Foo ${$.struct.name}`)
            }
          ]
        }
      }
    })

    const res = await action.run($ctx())

    expect(res.data).toStrictEqual("Foo Bar")
  })

  it("should be able to pass exeptions", async () => {
    const action = workflow({
      name: "Foo",
      action: {
        type: ["steps"],
        params: {
          continueOnError: true,
          actions: [
            {
              name: "error",
              type: ["parallel"],
              params: {
                actions: [
                  {
                    name: "fail",
                    type: ["exit"],
                    params: {
                      status: 403
                    }
                  }
                ]
              }
            },
            {
              name: "return",
              type: ["struct"],
              params: $query(($) => $.exceptions.error.fail)
            }
          ]
        }
      }
    })

    const res = await action.run($ctx())

    expect(res.data).toStrictEqual(undefined)
    expect(res.exception).toStrictEqual(new Exception({ status: 403 }))
  })

  it("should work with streams", async () => {
    const action = workflow({
      name: "Foo",
      action: {
        type: ["steps"],
        params: {
          actions: [
            {
              name: "file",
              type: ["struct"],
              params: $stream(async function* () {
                yield { name: "Alice", age: 30 }
                yield { name: "Bob", age: 25 }
                await $delay(100)
                yield { name: "Charlie", age: 35 }
              })
            },
            {
              name: "csv",
              type: ["csv"],
              params: {
                rows: $query(($) => $.file)
              }
            },
            {
              type: ["struct"],
              params: $query(
                async ($) => `Foo\n${await new Response($.csv).text()}`
              )
            }
          ]
        }
      }
    })

    const res = await action.run($ctx())

    expect(res.data).toStrictEqual(
      "Foo\nname,age\r\nAlice,30\r\nBob,25\r\nCharlie,35"
    )
  })

  it("should work with condition", async () => {
    const action = workflow({
      name: "Foo",
      action: {
        type: ["steps"],
        params: {
          actions: [
            {
              name: "item",
              type: ["struct"],
              params: { name: "Foo" }
            },
            {
              name: "res",
              type: ["condition"],
              params: {
                if: $query(($) => $.item.name === "Foo"),
                do: {
                  name: "item2",
                  type: ["steps"],
                  params: {
                    actions: [
                      {
                        name: "item3",
                        type: ["struct"],
                        params: { success: true }
                      }
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    })

    const res = await action.run($ctx())

    expect(res.data).toStrictEqual({ success: true })
  })

  it("should work with loops", async () => {
    const action = workflow({
      name: "Foo",
      action: {
        type: ["steps"],
        params: {
          actions: [
            {
              name: "item",
              type: ["struct"],
              params: { name: "Foo" }
            },
            {
              name: "res",
              type: ["loop"],
              params: {
                list: [1, 2],
                itemName: "item",
                action: {
                  type: ["struct"],
                  params: "{{ $.item.value }}"
                }
              }
            }
          ]
        }
      }
    })

    const res = await action.run($ctx())

    expect(res.data).toStrictEqual([1, 2])
  })
})
