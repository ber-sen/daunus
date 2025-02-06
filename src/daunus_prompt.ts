import { type LanguageModelV1 } from "@ai-sdk/provider"
import { type Ctx } from "./types"

export type PromptFactory<> = ReturnType<typeof $prompt>

export function $prompt(defaultParams?: {
  model?: LanguageModelV1
  ctx?: Ctx
}) {
  return function template(params?: { model?: LanguageModelV1 }) {
    return async function <T>(
      strings: TemplateStringsArray,
      ...values: T[]
    ): Promise<
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      T extends Zod.ZodType<infer U, any, any> ? U : string
    > {
      const prompt = strings.reduce(
        (result, str, i) =>
          result + str + (values[i]),
        ""
      )

      const mode = {
        type: "regular" as const,
        tools: undefined,
        toolChoice: undefined
      }

      const model = params?.model ?? defaultParams?.model
      if (!model) {
        throw new Error("No language model provided.")
      }

      const { text } = await model.doGenerate({
        mode,
        prompt: [{ role: "user", content: [{ type: "text", text: prompt }] }],
        inputFormat: "prompt"
      })

      return text as any
    }
  }
}
