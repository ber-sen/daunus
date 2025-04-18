import { type z } from "zod"

import { $action } from "./daunus-action"
import { $ctx } from "./daunus-helpers"
import { type ComposedAction, type Ctx } from "./types"

export const $composedAction =
  <I, P, O, E = {}>(
    args: {
      type: string
      name?: string
      paramsSchema?: z.Schema<P>
      skipParse?: boolean
      skipPlaceholders?: boolean
      envSchema?: z.Schema<E>
      inputSchema?: z.Schema<I>
    },
    fn: ({ ctx, env }: { ctx: Ctx; env: E }) => (params: P) => Promise<O> | O
  ) =>
  (
    params: P,
    actionCtx?: {
      name?: string
    }
  ): ComposedAction<O, I, E> => {
    const factory = $action<P, O, E>(args, (options) => fn(options))

    const action = factory(params, actionCtx)

    const execute = (
      ...args: [ctx?: Map<string, any>] | [input: I, ctx?: Map<string, any>]
    ) => {
      const ctx = getContext(...args)

      return action(ctx)
    }

    const toAction = ((input: I) => {
      Object.assign((ctx: Ctx = $ctx()) => {
        ctx.set("input", input)

        return action(ctx)
      }, action)
    }) as I extends object ? typeof toAction : never

    return Object.assign(execute, { ...action, toAction })
  }

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

      return $ctx().set("input", args[0])
    }

    case 2: {
      return (args[1] ?? $ctx()).set("input", args[0])
    }
  }
}
