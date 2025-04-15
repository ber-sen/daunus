import { z } from "zod"
import { type Expect, type Equal } from "./types-helpers"
import { $input } from "."
import { $agent } from "./daunus-agent"
import { type } from "arktype"

describe("$agent", () => {
  xit("should work with a task as input", async () => {
    const agent = $agent("You are a greeting agent")

    const { data } = await agent({ task: "Say hello in Spanish" })

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual(true)
  })

  xit("should work with different output on task", async () => {
    const agent = $agent("You are a michelin star chef")

    const ingredient = type({
      name: "string",
      amount: "string"
    })

    const output = type({
      name: "string",
      ingredients: ingredient.array(),
      steps: "string[]"
    })

    const { data } = await agent({
      task: { description: "Generate a lasagna recipe.", output }
    })

    type data = Expect<
      Equal<
        typeof data,
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

  xit("should work with a goal as input", async () => {
    const agent = $agent(
      "You are a marketing strategist focused on increasing user signups."
    )

    const { data } = await agent({
      goal: "Increase user signups by 20%"
    })

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual(true)
  })

  xit("should work with a with goal properties as input", async () => {
    const agent = $agent(
      "You are a marketing strategist focused on increasing user signups."
    )

    const { data } = await agent({
      goal: {
        desiredOutcome: "Increase user signups by 20%",
        maxAttempts: 4
      }
    })

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual(true)
  })

  xit("should work with a response as input", async () => {
    const agent = $agent(
      "You are an AI customer support agent for a fashion e-commerce store."
    )

    const { data } = await agent({
      response: [
        {
          role: "user",
          content: "Where's my order #84923? I was expecting it two days ago."
        },
        {
          role: "assistant",
          content:
            "Hi there! Let me check the status of your order #84923. One moment please..."
        },
        {
          role: "assistant",
          content:
            "Your order #84923 is currently in transit and is expected to be delivered by tomorrow. I'm really sorry about the delay! If you need help with anything else, I'm here for you."
        },
        {
          role: "user",
          content: "I want to return a pair of jeans I bought. They don't fit."
        }
      ]
    })

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual(true)
  })

  xit("should work with defined task", async () => {
    const agent = $agent("You are a greeting agent") //
      .task("Say hello in Spanish")

    const { data } = await agent.execute()

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual(true)
  })

  xit("should work with input", async () => {
    const input = $input({ language: z.string() })

    const agent = $agent("You are a greeting agent")
      .input(input)

      .task(({ scope }) => `Say hello in ${scope.input.language}`)

    const { data } = await agent.execute({ language: "Spanish" })

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

    const { data } = await agent.execute({
      review: "This product is amazing! I love using it every day."
    })

    type A = typeof data

    type data = Expect<Equal<A, "positive" | "negative" | "neutral">>

    expect(data).toEqual(true)
  })

  xit("should work with resources without input", async () => {
    const agent = $agent("You analyze scientific papers")
      .resources()

      .add("Tool 1", () => ({}))

      .add("Tool 2", () => ({}))

      .add("Document 1", () => ({}))

    const { data } = await agent({
      task: "This study finds that AI models improve efficiency by 30% in automated processes."
    })

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual(true)
  })

  xit("should work with resources without input and with task", async () => {
    const agent = $agent("You analyze scientific papers")
      .resources()

      .add("Tool 1", () => ({}))

      .add("Tool 2", () => ({}))

      .add("Document 1", () => ({}))

      // .task("asdasdas")

    const { data } = await agent()

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual(true)
  })

  xit("should work with resources without input and with goal", async () => {
    const agent = $agent(
      "You are a marketing strategist focused on increasing user signups."
    )
      .resources()

      .add("Ad Campaign Manager", () => ({}))

      .add("Email Outreach Tool", () => ({}))

      .add("Website Optimizer", () => ({}))

      // .goal(() => ({
      //   desiredOutcome: "Increase user signups by 20%",
      //   maxAttempts: 3
      // }))

    const { data } = await agent()

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual(true)
  })

  xit("should work with resources and input", async () => {
    const input = $input({ paperText: z.string() })

    const agent = $agent("You analyze scientific papers")
      .input(input)

      .resources()

      .add("Tool 1", () => ({}))

      .add("Tool 2", () => ({}))

      .add("Document 1", () => ({}))

      // .task("TODO")

    const { data } = await agent({
      paperText:
        "This study finds that AI models improve efficiency by 30% in automated processes."
    })

    type A = typeof data

    type data = Expect<Equal<A, string>>

    expect(data).toEqual(true)
  })
})
