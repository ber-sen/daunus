import { type LanguageModelV1 } from "@ai-sdk/provider"
import { type Ctx } from "./types"

export type PromptFactory<> = ReturnType<typeof $prompt>

export function $prompt(defaultParams?: {
  model?: LanguageModelV1
  ctx?: Ctx
}) {
  return async function <T extends unknown[]>(
    strings: TemplateStringsArray,
    ...values: T
  ): Promise<
    [Extract<T[number], Zod.ZodType<any, any, any>>] extends [never]
      ? string
      : Extract<T[number], Zod.ZodType<any, any, any>> extends Zod.ZodType<
            infer U,
            any,
            any
          >
        ? U
        : string
  > {
    const prompt = strings.reduce(
      (result, str, i) =>
        result + str + (typeof values[i] === "string" ? values[i] : ""),
      ""
    )

    const mode = {
      type: "regular" as const,
      tools: undefined,
      toolChoice: undefined
    }

    const model = defaultParams?.model
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
