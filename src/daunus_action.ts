/* eslint-disable @typescript-eslint/ban-types */
import { v4 } from "@lukeed/uuid/secure";
import { UnknownKeysParam, ZodRawShape, ZodTypeAny, z } from "zod";

import { resolveParams } from "./resolve_params";
import {
  ErrorParams,
  DaunusAction,
  DaunusActionInfo,
  DaunusActionOptions,
  DaunusActionRunOptions,
  DaunusActionWithParams,
  DaunusCtx,
  DaunusParams
} from "./types";

import { isError, parseResult } from "./helpers";

export const $action =
  <P, O, E = {}, T = O>(
    args: {
      type: string;
      name?: string;
      paramsSchema?: z.Schema<P>;
      skipParse?: boolean;
      parseResponse?: boolean;
      skipLog?: boolean;
      skipPlaceholders?: boolean;
      envSchema?: z.Schema<E>;
    },
    run: (
      params: P,
      { ctx, parseParams, env }: DaunusActionOptions<E>
    ) => Promise<O> | O,
    container: (
      r: (
        params: P,
        { ctx, parseParams, env }: DaunusActionOptions<E>
      ) => Promise<O> | O,
      args: [P, DaunusActionOptions<E>]
    ) => Promise<T> | T = (r, args) => r(...args) as T | Promise<T>
  ) =>
  (
    params: DaunusParams<P>,
    actionCtx?: {
      name?: string;
      skipLog?: boolean;
    }
  ) => {
    const name: string = actionCtx?.name || args.name || v4();
    const skipLog = actionCtx?.skipLog || args.skipLog || false;

    const actionInfo: DaunusActionInfo<T, ErrorParams<T, P>> = {
      name,
      type: args.type,
      params: null
    };

    const makeRun =
      (init?: (ctx: DaunusCtx) => void) =>
      async (
        ctx: DaunusCtx = new Map(),
        options?: DaunusActionRunOptions<T, ErrorParams<T, P>>
      ) => {
        try {
          if (!ctx.has("actions")) {
            ctx.set("useCase", actionInfo);
            ctx.set("actions", new Map());
          }

          const runFn = async () => {
            init && init(ctx);

            const parsedParams =
              args.skipParse || !params
                ? params
                : await parseParams(ctx, params, {
                    schema: args.paramsSchema,
                    skipPlaceholders: args.skipPlaceholders
                  });

            actionInfo.params = parsedParams;

            if (isError(parsedParams)) {
              return parsedParams;
            }

            const env = args.envSchema
              ? args.envSchema.parse(ctx.get(".env"))
              : (z.object({}) as E);

            const value = await container(run, [
              parsedParams!,
              { ctx, parseParams, env }
            ]);

            if (!args.parseResponse) {
              return value;
            }

            const parseValue = await parseParams(ctx, value, {
              skipPlaceholders: true
            });

            return parseValue;
          };

          const value = parseResult<T, ErrorParams<T, P>>((await runFn()) as T);

          ctx.set(name, value);
          actionInfo.data = value.data;
          actionInfo.error = value.error;

          if (!skipLog) {
            ctx.get("actions").set(actionInfo.name, actionInfo);
          }

          return value;
        } catch (error: any) {
          actionInfo.error = error;

          if (!skipLog) {
            ctx.get("actions").set(actionInfo.name, actionInfo);
          }

          throw error;
        } finally {
          if (options?.onComplete) {
            options.onComplete(actionInfo, ctx);
          }
        }
      };

    const action: DaunusAction<T, ErrorParams<T, P>, E> = {
      ...actionCtx,
      name,
      envSchema: args.envSchema,
      run: makeRun()
    };

    const actionWithOptions: DaunusActionWithParams<T, ErrorParams<T, P>, E> = {
      ...action,
      noParams: () => action,
      withParams: <
        W extends ZodRawShape,
        U extends UnknownKeysParam,
        C extends ZodTypeAny,
        O,
        I,
        Z,
        B,
        Q
      >(
        iSchema: z.ZodObject<W, U, C, O, I>,
        meta?: {
          openapi?: {
            method?:
              | "get"
              | "post"
              | "put"
              | "delete"
              | "patch"
              | "head"
              | "options"
              | "trace";
            contentType?: string;
            params?: Z;
            body?: B;
            query?: Q;
          };
        }
      ) => ({
        meta: {
          ...meta,
          iSchema
        },
        input: (value: I): DaunusAction<T, ErrorParams<T, P>, E> => ({
          ...action,
          run: makeRun((ctx) => {
            ctx.set("input", iSchema.parse(value));
          })
        }),
        rawInput: (value: unknown): DaunusAction<T, ErrorParams<T, P>, E> => ({
          ...action,
          run: makeRun((ctx) => {
            ctx.set("input", iSchema.parse(value));
          })
        })
      })
    };

    return actionWithOptions;
  };

export const parseParams = async <T>(
  ctx: Map<string, any>,
  params: DaunusParams<T>,
  options?: {
    schema?: z.Schema<T>;
    skipPlaceholders?: boolean;
  }
) => {
  const resolvedParams = await resolveParams(ctx, params, {
    skipPlaceholders: options?.skipPlaceholders
  });

  if (!options?.schema) {
    return resolvedParams as T;
  }

  return options?.schema.parse(resolvedParams) as T;
};
