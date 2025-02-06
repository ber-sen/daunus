import { createOpenAI } from "@ai-sdk/openai"
import { $prompt } from "./daunus_prompt"
import { z } from "zod"
import { type Equal, type Expect } from "./types_helpers"

describe("$prompt", () => {
  xit("should return the value", async () => {
    const openai = createOpenAI({ apiKey: "asdasd" })

    const prompt = $prompt({ model: openai("o3-mini") })

    const text = await prompt`
      Say hello in spanish
    `

    expect(text).toEqual("Hola")
  })

  xit("should work with structurd output", async () => {
    const openai = createOpenAI({ apiKey: "asdasd" })

    const prompt = $prompt({ model: openai("o3-mini") })

    const output = z.object({
      name: z.string(),
      ingredients: z.array(z.object({ name: z.string(), amount: z.string() })),
      steps: z.array(z.string())
    })

    const recipe = await prompt`
      ---
      schema: "${output}"
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
