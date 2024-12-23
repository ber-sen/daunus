import { $ctx } from "./daunus_helpers"
import { DaunusCtx } from "."

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

export const createRun = <I>(
  fn: <T>(ctx: DaunusCtx) => any
): I extends object
  ? (input: I, ctx?: Map<string, any>) => Promise<any>
  : (ctx?: Map<string, any>) => Promise<any> => {
  const enhancedFn = (
    ...args: [ctx?: Map<string, any>] | [input: I, ctx?: Map<string, any>]
  ) => {
    const ctx = getContext(...args)

    return fn(ctx)
  }

  return enhancedFn as any
}
