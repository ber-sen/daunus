import { $steps } from "./daunus_steps"
import { StepFactory } from "./new_types"

import { Equal, Expect } from "./types"

describe("$steps", () => {
  it("should convert keys to cammel case", () => {
    const steps = $steps()
      .add("first step", () => ({
        foo: "bar"
      }))

      .add("second step", ({ $ }) => $.firstStep.foo)

    type A = typeof steps.scope.local

    type steps = Expect<
      Equal<
        A,
        {
          firstStep: {
            foo: string
          }
          secondStep: string
        }
      >
    >
  })

  it("should work with one step", async () => {
    const steps = $steps()
      .add("first step", () => ({
        foo: "bar"
      }))

    expect(await steps.run()).toEqual({ foo: "bar" })
  })

  it("should return the return value of last key by default", async () => {
    const steps = $steps() //
      .add({ name: "first step" }, () => ({
        foo: "bar"
      }))

      .add("second step", ({ $ }) => $)

    expect(await steps.run()).toEqual({ firstStep: { foo: "bar" } })
  })

  it("should provide an easy way to extend", () => {
    const nested = $steps()
      .add("sub", ({ $steps }) =>
        $steps()

          .add("first step", () => ({ foo: "bar" }))

          .add("second step", ({ $ }) => $.firstStep.foo.toString())
      )

    function toJson(factory: StepFactory<any, any>) {
      const steps = Object.values(factory.scope.steps).map((value) => {
        const functionValue = value.meta.fn.toString()

        const body = functionValue?.split("=>")?.[1]?.trim()

        const formatJson = body
          .replace(/(["'])?(\w+)(["'])?:/g, '"$2": ')
          .replace(`({`, `{`)
          .replace(/}\)(?=[^}]*$)/, "}")
          .replace(
            /("[\dA-Za-z-]+"):\s+([\d$().A-Za-z-]+)/gm,
            (match: any, key: string, value: string) => {
              if (value === "true" || value === "false") {
                return `${key}:${value}`
              }

              return Number.isNaN(Number.parseInt(value, 10))
                ? `${key}:"{{ ${value} }}"`
                : `${key}:${value}`
            }
          )

        let parsed

        try {
          parsed = JSON.parse(formatJson)
        } catch {
          parsed = `{{ ${body} }}`
        }

        return {
          type: ["struct"],
          name: value.meta.name,
          params: parsed
        }
      })

      return {
        type: ["steps"],
        params: {
          steps: [steps]
        }
      }
    }

    expect(toJson(nested.get("sub"))).toEqual({
      type: ["steps"],
      params: {
        steps: [
          [
            { type: ["struct"], name: "first step", params: { foo: "bar" } },
            {
              type: ["struct"],
              name: "second step",
              params: "{{ $.firstStep.foo.toString() }}"
            }
          ]
        ]
      }
    })
  })

  it("should return the return value of last key by default in nested", async () => {
    const steps = $steps()
      .add("nested", ({ $steps }) =>
        $steps()

          .add("nested", () => ({
            foo: "bar"
          }))

          .add("second step", ({ $ }) => $.nested.foo)
      )

      .add("return", ({ $ }) => $.nested)

    expect(await steps.run()).toEqual("bar")
  })

  it("should display proper types for parallel ", () => {
    const steps = $steps()
      .add("data", () => [1, 2, 3] as const)

      .add("parallel", ({ $steps }) =>
        $steps({ stepsType: "parallel" })

          .add("first step", () => ({
            foo: "bar"
          }))

          .add("second step", ({ $ }) => $)
      )
      .add("return", ({ $ }) => $.parallel)

    type A = Awaited<ReturnType<(typeof steps)["run"]>>

    type steps = Expect<
      Equal<
        A,
        {
          firstStep: {
            foo: string
          }
          secondStep: {
            data: readonly [1, 2, 3]
          }
        }
      >
    >
  })

  it("should work for empty steps", async () => {
    const steps = $steps()
      .add("data", () => {})

      .add("return", () => true)

    expect(await steps.run()).toEqual(true)
  })

  it("should return the all values if type is parallel", async () => {
    const steps = $steps()
      .add("data", () => [1, 2, 3])

      .add("parallel", ({ $steps }) =>
        $steps({ stepsType: "parallel" })

          .add("first step", () => ({
            foo: "bar"
          }))

          .add("second step", ({ $ }) => $.data)
      )

      .add("return", ({ $ }) => $.parallel)

    expect(await steps.run()).toEqual({
      firstStep: { foo: "bar" },
      secondStep: [1, 2, 3]
    })
  })

  it("should work with nested steps inside parallel", async () => {
    const steps = $steps()
      .add("data", () => [1, 2, 3])

      .add("parallel", ({ $steps }) =>
        $steps({ stepsType: "parallel" })

          .add("first step", () => ({
            foo: "bar"
          }))

          .add("second step", ({ $steps }) =>
            $steps()

              .add("nested", ({ $ }) => ({
                foo: $.data
              }))

              .add("second step", ({ $ }) => $.nested.foo)
          )
      )

      .add("return", ({ $ }) => $.parallel)

    expect(await steps.run()).toEqual({
      firstStep: { foo: "bar" },
      secondStep: [1, 2, 3]
    })
  })

  it("should resolve promises", async () => {
    const steps = $steps()

      .add("nested", ({ $steps }) =>
        $steps()

          .add("nested", () =>
            Promise.resolve({
              foo: "bar"
            })
          )

          .add("second step", ({ $ }) => $.nested.foo)
      )

      .add("return", ({ $ }) => $.nested)

    expect(await steps.run()).toEqual("bar")
  })

  it("should resolve nested values inside promise", async () => {
    const steps = $steps()

      .add("nested", ({ $steps }) =>
        $steps()

          .add("sub", ({ $steps }) =>
            Promise.resolve($steps().add("sub", () => [1, 2, 3]))
          )

          .add("second step", ({ $ }) => $.sub)
      )

      .add("return", ({ $ }) => $.nested)

    expect(await steps.run()).toEqual([1, 2, 3])
  })

  it("should resolve promises in parallel", async () => {
    const steps = $steps()
      .add("data", () => Promise.resolve([1, 2, 3]))

      .add("parallel", ({ $steps }) =>
        $steps({ stepsType: "parallel" })

          .add("first step", () =>
            Promise.resolve({
              foo: "bar"
            })
          )

          .add("second step", ({ $steps }) =>
            Promise.resolve(
              $steps()
                .add("nested", ({ $ }) =>
                  Promise.resolve({
                    foo: $.data
                  })
                )

                .add("second step", ({ $ }) => $.nested.foo)
            )
          )
      )

      .add("return", ({ $ }) => $.parallel)

    expect(await steps.run()).toEqual({
      firstStep: { foo: "bar" },
      secondStep: [1, 2, 3]
    })
  })
})
