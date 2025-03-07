import { $ctx } from "../../daunus-helpers"

import { $query } from "../.."
import steps from "."
import { Exception } from "../../daunus-exception"

describe("steps", () => {
  it("should work for basic example", async () => {
    const action = steps({
      steps: [
        {
          name: "test",
          type: ["struct"],
          params: {
            foo: "bar"
          }
        }
      ]
    })

    const res = await action.run($ctx())

    expect(res.data).toStrictEqual({ foo: "bar" })
  })

  it("should work with query", async () => {
    const action = steps({
      steps: [
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
    })

    const res = await action.run($ctx())

    expect(res.data).toStrictEqual("bar")
  })

  it("should stop on error", async () => {
    const action = steps({
      steps: [
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
    })

    const res = await action.run($ctx())

    expect(res.exception).toStrictEqual(new Exception({ status: 404 }))
  })

  it("should work with nested steps", async () => {
    const ctx = $ctx()

    const action = steps({
      steps: [
        {
          name: "test",
          type: ["steps"],
          params: {
            steps: [
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
    })

    const res = await action.run(ctx)

    expect(res.data).toStrictEqual({ foo: "barasd" })
  })

  it("should NOT be able to access return of the first action from the second in parallel", async () => {
    const action = steps({
      stepsType: "parallel",
      steps: [
        {
          name: "sub1",
          type: ["struct"],
          params: {
            foo: "bar"
          }
        },
        {
          name: "sub2",
          type: ["struct"],
          params: $query(($) => $?.test?.data)
        }
      ]
    })

    const res = await action.run($ctx())

    expect(res.data).toStrictEqual({ sub1: { foo: "bar" }, sub2: undefined })
  })

  it("should work with with nested parallel", async () => {
    const action = steps({
      stepsType: "parallel",
      steps: [
        {
          name: "test",
          type: ["steps"],
          params: {
            stepsType: "parallel",
            steps: [
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
          name: "sub2",
          type: ["struct"],
          params: "action.2"
        }
      ]
    })

    const res = await action.run($ctx())

    expect(res.data).toStrictEqual({
      test: { nested1: "action.1.1", nested2: "action.1.2" },
      sub2: "action.2"
    })
  })

  it("should work with with nested serial", async () => {
    const action = steps({
      stepsType: "serial",
      steps: [
        {
          name: "test",
          type: ["steps"],
          params: {
            stepsType: "serial",
            steps: [
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
    })

    const res = await action.run($ctx())

    expect(res.data).toStrictEqual({
      test: { nested1: "action.1.1", nested2: "action.1.2" },
      test2: "action.1.1"
    })
  })
})
