import {
  type LanguageModelV1Message,
  type LanguageModelV1
} from "@ai-sdk/provider"
import { type Model, type Ctx } from "./types"
import { truthy } from "./helpers"

type PromptInputs =
  | {
      user: string
    }
  | {
      system: string
      user: string
    }
  | {
      assistant: string
      user: string
    }
  | {
      system: string
      assistant: string
      user: string
    }

type PromptOptions<O> = {
  model?: Model
  output?: Zod.ZodType<O>
} & PromptInputs

export interface PromptFactory {
  <O = string>(options: PromptOptions<O>): Promise<O>
  <T extends unknown[]>(
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
  >
}

function isTemplate(options: any): options is TemplateStringsArray {
  return Array.isArray(options)
}

export function $prompt(defaultParams?: {
  model?: LanguageModelV1
  ctx?: Ctx
}): PromptFactory {
  return async function (
    options: TemplateStringsArray | PromptOptions<any>,
    ...values: any
  ) {
    const prompt: LanguageModelV1Message[] = (() => {
      if (isTemplate(options)) {
        const text = options.reduce(
          (result, str, i) =>
            result + str + (typeof values[i] === "string" ? values[i] : ""),
          ""
        )

        return [{ role: "user", content: [{ type: "text", text }] }]
      }

      return [
        "system" in options && {
          role: "system" as const,
          content: options.system
        },
        "assistant" in options && {
          role: "assistant" as const,
          content: [{ type: "text" as const, text: options.assistant }]
        },
        {
          role: "user" as const,
          content: [{ type: "text" as const, text: options.user }]
        }
      ].filter(truthy)
    })()

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
      prompt,
      inputFormat: "prompt"
    })

    return text as any
  }
}
