import { $ctx, type Model, type Ctx } from "."
import { $models } from "./daunus-models"
import { createOpenAI } from "@ai-sdk/openai"

import { type Expect, type Equal } from "./types-helpers"

describe("$models", () => {
  it("should be able to add factories and create actions", async () => {
    const models = $models() //
      .add("OpenAI", (ctx: Ctx) =>
        createOpenAI({ apiKey: ctx.get("OPEN_API_KEY") })
      )

    const model = models("OpenAI:gpt-4o")

    type model = Expect<Equal<typeof model, Model>>

    const instance = model($ctx())

    expect(instance.modelId).toEqual("gpt-4o")
  })
})
