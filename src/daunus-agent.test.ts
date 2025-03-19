import { z } from "zod"
import { type Expect, type Equal } from "./types-helpers"
import { $input } from "."
import { $agent } from "./daunus-agent"

describe("$agent", () => {
  xit("should work with single task", async () => {
    const agent = $agent("You are a greeting agent") //
      .task("Say hello in Spanish")

    const { data } = await agent.run()

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual(true)
  })

  xit("simple agent with input", async () => {
    const input = $input({ language: z.string() })

    const agent = $agent("You are a greeting agent")
      .input(input)

      .task(({ scope }) => `Say hello in ${scope.input.language}`)

    const { data } = await agent.run({ language: "Spanish" })

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual(true)
  })

  xit("should work with defined output", async () => {
    const input = $input({ review: z.string() })

    const sentiment = z.enum(["positive", "negative", "neutral"])

    const agent = $agent("You categorize customer reviews based on sentiment.")
      .input(input)

      .task(({ scope }) => ({
        description: `Categorize this review: ${scope.input.review}`,
        output: sentiment
      }))

    const { data } = await agent.run({
      review: "This product is amazing! I love using it every day."
    })

    type A = typeof data

    type data = Expect<Equal<A, "positive" | "negative" | "neutral">>

    expect(data).toEqual(true)
  })

  xit("should work for multiple tasks", async () => {
    const input = $input({ paperText: z.string() })

    const agent = $agent("You analyze scientific papers")
      .input(input)

      .resources()

      .add("Tool 1", () => ({}))

      .add("Tool 2", () => ({}))

      .add("Document 1", () => ({}))

      .task("TODO")

    const { data } = await agent.run({
      paperText:
        "This study finds that AI models improve efficiency by 30% in automated processes."
    })

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual(true)
  })
})
