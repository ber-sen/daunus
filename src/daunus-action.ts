import { z } from "zod"
import { v4 } from "@lukeed/uuid"
import { resolveParams } from "./resolve-params"
import {
  type ActionFactory,
  type Action,
  type Ctx,
  type ExtractData,
  type ExtractExceptions
} from "./types"
import { isException, parseResult } from "./helpers"
import { Exception } from "./daunus-exception"

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
  ): ActionFactory<P, O, E> =>
  (
    params: P,
    actionMeta?: {
      name?: string
    }
  ): Action<O, E> => {
    const name: string = actionMeta?.name ?? args.name ?? v4()

    const run = async (ctx: Ctx = new Map()) => {
      try {
        const runFn = async () => {
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

        const value = parseResult<O>((await runFn()) as O)

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

    return {
      ...actionMeta,
      name,
      env: args.envSchema?._type ?? ({} as E),
      run
    }
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
