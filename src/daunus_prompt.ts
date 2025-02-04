import { type LanguageModelV1 } from "@ai-sdk/provider"

export function $prompt(defaultParams?: { model: LanguageModelV1 }) {
  return function template(params?: { model?: LanguageModelV1 }) {
    return async function (
      strings: TemplateStringsArray,
      ...values: any[]
    ): Promise<string> {
      const prompt = strings.reduce(
        (result, str, i) =>
          result + str + (values[i] !== undefined ? values[i] : ""),
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

      return text ?? ""
    }
  }
}
