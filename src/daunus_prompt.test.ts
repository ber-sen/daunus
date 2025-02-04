import { createOpenAI } from "@ai-sdk/openai"
import { $prompt } from "./daunus_prompt"

describe("$prompt", () => {
  xit("should return the value", async () => {
    const openai = createOpenAI({ apiKey: "asdasd" })

    const prompt = $prompt({ model: openai("o3-mini") })

    const text = await prompt()`
      Say hello in spanish
    `

    expect(text).toEqual("Hola")
  })
})
