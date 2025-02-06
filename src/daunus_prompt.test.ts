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
      ingredients: z.array(z.object({ name: z.string(), amount: z.string() }))
    })

    const recipe = await prompt`
      Generate a lasagna recipe.
    
      # Output: ${output}
    `

    type A = typeof recipe

    type recipe = Expect<
      Equal<
        A,
        {
          ingredients: {
            name: string
            amount: string
          }[]
        }
      >
    >

    expect(recipe).toEqual({})
  })
})
