import { z } from "zod"
import { v4 } from "@lukeed/uuid"
import { resolveParams } from "./resolve-params"
import {
  type Action,
  type Ctx,
} from "./types"
import { isException, parseResult } from "./helpers"
import { Exception } from "./daunus-exception"
import { type ExtractData, type ExtractExceptions } from "./types-helpers"

export const $action =
  <P, O, E = {}>(
    args: {
      type: string
      name?: string
      paramsSchema?: z.Schema<P>
      skipParse?: boolean
      skipPlaceholders?: boolean
      envSchema?: z.Schema<E>
    },
    fn: ({ ctx, env }: { ctx: Ctx; env: E }) => (params: P) => Promise<O> | O
  ) =>
  (
    params: P,
    actionMeta?: {
      name?: string
    }
  ): Action<O, undefined, E> => {
    const name: string = actionMeta?.name ?? args.name ?? v4()

    const execute = async (ctx: Ctx = new Map()) => {
      try {
        const executeFn = async () => {
          const parsedParams =
            args.skipParse || !params
              ? params
              : await parseParams(ctx, params, {
                  schema: args.paramsSchema,
                  skipPlaceholders: args.skipPlaceholders
                })

          if (isException(parsedParams)) {
            return parsedParams
          }

          const env = args.envSchema
            ? args.envSchema.parse(ctx.get(".env"))
            : (z.object({}) as E)

          const value = await fn({ ctx, env })(parsedParams)

          return value
        }

        const value = parseResult<O>((await executeFn()) as O)

        ctx.set(name, value.data)

        if (value.exception) {
          ctx.set(
            "exceptions",
            (ctx.get("exceptions") ?? new Map()).set(name, value.exception)
          )
        }

        return value
      } catch (error: any) {
        const exception = new Exception({ data: error.message })

        ctx.set(
          "exceptions",
          (ctx.get("exceptions") ?? new Map()).set(name, exception)
        )

        return {
          data: undefined,
          exception
        } as {
          data: ExtractData<O>
          exception: ExtractExceptions<O>
        }
      }
    }

    return Object.assign(execute, {
      meta: {
        name,
        env: args.envSchema?._type ?? ({} as E),
        ...actionMeta
      }
    })
  }

export const parseParams = async <T>(
  ctx: Map<string, any>,
  params: T,
  options?: {
    schema?: z.Schema<T>
    skipPlaceholders?: boolean
  }
) => {
  const resolvedParams = await resolveParams(ctx, params, {
    skipPlaceholders: options?.skipPlaceholders
  })

  if (!options?.schema) {
    return resolvedParams as T
  }

  return options?.schema.parse(resolvedParams)
}
