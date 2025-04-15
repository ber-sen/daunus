import { z } from "zod"
import { $useCase } from "./daunus-use-case"
import { type Expect, type Equal } from "./types-helpers"
import { $input, exit } from "."
import { Exception } from "./daunus-exception"

describe("$useCase", () => {
  it("should work without input", async () => {
    const useCase = $useCase("Hello world").handle(
      ({ scope }) => scope.useCase.originalName
    )

    const { data } = await useCase()

    type A = typeof data

    type data = Expect<Equal<A, "Hello world">>

    expect(data).toEqual("Hello world")
  })

  it("should work for single step", async () => {
    const input = $input({ name: "string" })

    const useCase = $useCase("name")
      .input(input)

      .handle(({ scope }) => scope.input.name === "lorem")

    const { data } = await useCase({ name: "lorem" })

    type A = typeof data

    type data = Expect<Equal<A, boolean>>

    expect(data).toEqual(true)
  })

  it("should work for single step with arkType input", async () => {
    const input = $input({ messages: "string[]" })

    const useCase = $useCase("name")
      .input(input)

      .handle(({ scope }) => scope.input.messages)

    const { data } = await useCase({ messages: ["lorem"] })

    type data = Expect<Equal<typeof data, string[]>>

    expect(data).toEqual(["lorem"])
  })

  xit("should work with prompts", async () => {
    const input = $input({ language: z.string() })

    const useCase = $useCase("Say hello in language")
      .input(input)

      .handle(
        ({ scope, prompt }) => prompt`
          Say hello in ${scope.input.language}
        `
      )

    const { data } = await useCase({ language: "Spanish" })

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual("Hola")
  })

  xit("should work with a structured output prompt", async () => {
    const input = $input({ dish: z.string() })

    const recipeOutput = z.object({
      name: z.string(),
      ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
      steps: z.array(z.string())
    })

    const useCase = $useCase("Generate a recipe")
      .input(input)

      .handle(
        ({ scope, prompt }) => prompt`
          ---
          schema: ${recipeOutput}
          ---
          Generate a recipe for ${scope.input.dish}.
        `
      )

    const { data } = await useCase({ dish: "Lasagna" })

    type A = typeof data

    type data = Expect<
      Equal<
        A,
        {
          name: string
          ingredients: {
            name: string
            amount: string
          }[]
          steps: string[]
        }
      >
    >

    expect(data).toEqual(true)
  })

  xit("should work with prompts inside objects", async () => {
    const input = $input({ name: z.string() })

    const useCase = $useCase("My use case")
      .input(input)

      .steps()

      .add("First step", async ({ scope, prompt }) => ({
        greeting: await prompt`
          Say hello to ${scope.input.name}
        `
      }))

      .add("second step", ({ scope }) => scope.firstStep.greeting)

    const { data } = await useCase({ name: "Luna" })

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual("Luna")
  })

  it("should provide expected types for return", async () => {
    const input = $input({ name: z.string() })

    const useCase = $useCase("My use case")
      .input(input)

      .steps()

      .add("First step", ({ scope }) => scope.input)

      .add("second step", ({ scope }) => scope.firstStep.name)
      
      

    const { data } = await useCase({ name: "Luna" })

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual("Luna")
  })

  it("should work with parallel steps", async () => {
    const input = $input({ city: z.string() })

    const useCase = $useCase("Example")
      .input(input)

      .steps({ stepsType: "parallel" })

      .add("first step", ({ scope }) => scope.input)

      .add("second step", () => 42)

    const { data } = await useCase({ city: "London" })

    type A = typeof data

    type data = Expect<
      Equal<
        A,
        {
          firstStep: {
            city: string
          }
          secondStep: number
        }
      >
    >

    expect(data).toEqual({
      firstStep: {
        city: "London"
      },
      secondStep: 42
    })
  })

  it("should return error inside loop ", async () => {
    const input = $input({ array: z.array(z.number()) })

    const useCase = $useCase("Loop with error")
      .input(input)

      .handle(({ iterate, scope }) =>
        //
        iterate({ list: scope.input.array })
          //
          .forEachItem()

          .add("exit", () => exit({ status: 500 }))
      )

    const { exception } = await useCase({ array: [1, 2, 3] })

    type A = typeof exception

    type exception = Expect<Equal<A, Exception<500, undefined, undefined>>>

    expect(exception).toEqual(new Exception({ status: 500 }))
  })

  it("should return error inside condition", async () => {
    const input = $input({ array: z.array(z.number()) })

    const useCase = $useCase("condition with error")
      .input(input)

      .handle(({ when, $ }) =>
        // add condition
        when({ condition: $.input.array.length > 1 })
          // add true branch
          .isTrue()

          .add("exit", () => exit({ status: 500 }))
      )

    const { exception } = await useCase({ array: [1, 2, 3] })

    type A = typeof exception

    type exception = Expect<Equal<A, Exception<500, undefined, undefined>>>

    expect(exception).toEqual(new Exception({ status: 500 }))
  })

  it("should work with loop and condition", async () => {
    const input = $input({ array: z.array(z.number()) })

    const useCase = $useCase("Loop and condition")
      .input(input)

      .handle(({ iterate, scope }) =>
        // create loop
        iterate({ list: scope.input.array })
          .forEachItem()

          .add("module", ({ scope }) => scope.item.value % 2)

          .add("branch", ({ when, scope }) =>
            when({ condition: scope.module === 0 })
              .isTrue()

              .add("even", ({ scope }) => `${scope.item.value} is even`)

              .isFalse()

              .add("odd", ({ scope }) => scope.item.value)
          )
      )

    const { data } = await useCase({ array: [1, 2, 3] })

    type A = typeof data

    type data = Expect<Equal<A, (string | number)[]>>

    expect(data).toEqual([1, "2 is even", 3])
  })
})
