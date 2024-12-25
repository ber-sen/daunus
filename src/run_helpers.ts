import { $ctx } from "./daunus_helpers"
import { DaunusCtx, DaunusActionOrActionWithInput } from "."

export const getContext = <I>(
  ...args: [input: I, ctx?: Map<string, any>] | [ctx?: Map<string, any>]
) => {
  switch (args.length) {
    case 0: {
      return $ctx()
    }

    case 1: {
      if (args[0] instanceof Map) {
        return args[0]
      }

      if (args[0] instanceof Object) {
        return $ctx().set("input", args[0])
      }

      return $ctx()
    }

    case 2: {
      return (args[1] ?? $ctx()).set("input", args[0])
    }
  }
}

export const createRun = <Input>(
  fn: (ctx: DaunusCtx) => any
): DaunusActionOrActionWithInput<Input, any, any>["run"] => {
  const enhancedFn = async (
    ...args: [ctx?: Map<string, any>] | [input: Input, ctx?: Map<string, any>]
  ) => {
    const ctx = getContext(...args)

    const data = await fn(ctx)

    return { data }
  }

  return enhancedFn as any
}
