import { type Model, type Ctx } from "."
import { type LanguageModelV1 } from "@ai-sdk/provider"

type Prefixed<P extends string, T extends string> = `${P}:${T}`

type ExcludeString<T> = T extends string ? (string extends T ? never : T) : T

export type ModelsFactory<Registry extends Record<string, any> = {}> = {
  add<
    Name extends string,
    I extends string,
    Value extends (name: I) => LanguageModelV1
  >(
    name: Name,
    value: (ctx: Ctx) => Value
  ): ModelsFactory<
    Registry &
      Record<Prefixed<Name, ExcludeString<Parameters<Value>[0]>>, Value>
  >
} & (<Name extends keyof Registry>(name: Name) => Model)

export function $models<Registry extends Record<string, any> = {}>(
  registry?: Registry
): ModelsFactory<Registry> {
  function add(name: any, value: any): any {
    return $models({
      ...registry,
      [name]: value
    })
  }

  function get(name: any): any {
    const index = name.indexOf(":")
    const provider = name.slice(0, index)
    const model = name.slice(index + 1)

    return (ctx: Ctx) => registry?.[provider](ctx)(model)
  }

  get.add = add

  return get
}
