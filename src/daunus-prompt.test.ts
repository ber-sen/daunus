import { createOpenAI } from "@ai-sdk/openai"
import { $prompt } from "./daunus-prompt"
import { z } from "zod"
import { type Equal, type Expect } from "./types-helpers"

describe("$prompt", () => {
  xit("should return the value", async () => {
    const openai = createOpenAI({ apiKey: "asdasd" })

    const prompt = $prompt({ model: openai("o3-mini") })

    const text = await prompt`
      Say hello in spanish
    `

    expect(text).toEqual("Hola")
  })

  xit("should work as function", async () => {
    const openai = createOpenAI({ apiKey: "asdasd" })

    const prompt = $prompt({ model: openai("o3-mini") })

    const benefitSchema = z.object({
      title: z.string(),
      description: z.string()
    })

    const recipe = await prompt({
      system: `You are an AI expert in digital transformation. 
        Provide clear and professional answers.`,

      assistant: `Automation helps SMEs reduce costs, increase efficiency, 
        and scale operations with minimal manual effort.`,

      user: "What are the benefits of automation for SMEs?",

      output: benefitSchema
    })

    expect(recipe).toEqual({})
  })

  xit("should work with structurd output inside template literals", async () => {
    const openai = createOpenAI({ apiKey: "asdasd" })

    const prompt = $prompt({ model: openai("o3-mini") })

    const output = z.object({
      name: z.string(),
      ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
      steps: z.array(z.string())
    })

    const recipe = await prompt`
      ---
      output: "${output}"
      ---
      Generate a lasagna recipe.
    `

    type A = typeof recipe

    type recipe = Expect<
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

    expect(recipe).toEqual({})
  })
})
