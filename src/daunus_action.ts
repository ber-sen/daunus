/* eslint-disable @typescript-eslint/ban-types */
import { z } from "zod";

import { v4 } from "@lukeed/uuid";
import { resolveParams } from "./resolve_params";
import {
  ExceptionParams,
  DaunusAction,
  DaunusActionInfo,
  DaunusActionRunOptions,
  DaunusActionWithParams,
  DaunusCtx,
  DaunusParams,
  DaunusReadable
} from "./types";
import { isException, parseResult } from "./helpers";

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
      container?: (parmas: P) => T;
    },
    fn: ({
      ctx,
      parseParams,
      env
    }: {
      ctx: DaunusCtx;
      parseParams: <X>(ctx: Map<string, any>, params: X) => Promise<X>;
      env: E;
    }) => (params: P) => Promise<O> | O,
    container: (
      r: ({
        ctx,
        parseParams,
        env
      }: {
        ctx: DaunusCtx;
        parseParams: <X>(ctx: Map<string, any>, params: X) => Promise<X>;
        env: E;
      }) => (params: P) => Promise<O> | O,
      options: {
        ctx: DaunusCtx;
        parseParams: <X>(ctx: Map<string, any>, params: X) => Promise<X>;
        env: E;
      },
      params: P
    ) => Promise<T> | T = (r, options, params) =>
      r(options)(params) as T | Promise<T>
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

    const actionInfo: DaunusActionInfo<T, ExceptionParams<T, P>> = {
      name,
      type: args.type,
      params: null
    };

    const makeRun =
      (init?: (ctx: DaunusCtx) => void) =>
      async (
        ctx: DaunusCtx = new Map(),
        options?: DaunusActionRunOptions<T, ExceptionParams<T, P>>
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

            if (isException(parsedParams)) {
              return parsedParams;
            }

            const env = args.envSchema
              ? args.envSchema.parse(ctx.get(".env"))
              : (z.object({}) as E);

            const value = await container(
              fn,
              { ctx, parseParams, env },
              parsedParams!
            );

            if (!args.parseResponse) {
              return value;
            }

            const parseValue = await parseParams(ctx, value, {
              skipPlaceholders: true
            });

            return parseValue;
          };

          const rawValue = parseResult<T, ExceptionParams<T, P>>(
            (await runFn()) as T
          );

          const value: typeof rawValue =
            !ctx.get("pass_streams") && rawValue.data instanceof DaunusReadable
              ? {
                  data: await rawValue.data.parse(),
                  exception: rawValue.exception
                }
              : (rawValue as any);

          ctx.set(name, value);

          actionInfo.data = value.data;
          actionInfo.exception = value.exception;

          if (!skipLog) {
            ctx.get("actions").set(actionInfo.name, actionInfo);
          }

          return value;
        } catch (error: any) {
          actionInfo.exception = error;

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

    const action: DaunusAction<T, ExceptionParams<T, P>, E> = {
      ...actionCtx,
      name,
      envSchema: args.envSchema,
      run: makeRun()
    };

    const actionWithOptions: DaunusActionWithParams<
      T,
      ExceptionParams<T, P>,
      E
    > = {
      ...action,
      noParams: () => action,
      withParams: (iSchema) => ({
        meta: {
          iSchema,
          openapi: {
            method:
              iSchema instanceof z.ZodObject && iSchema.shape.method
                ? `<% method %>`
                : "post",
            contentType:
              iSchema instanceof z.ZodObject && iSchema.shape.contentType
                ? `<% contentType %>`
                : "application/json",
            path:
              iSchema instanceof z.ZodObject && iSchema.shape.path
                ? `<% path %>`
                : undefined,
            body:
              iSchema instanceof z.ZodObject && iSchema.shape.body
                ? `<% body %>`
                : undefined,
            query:
              iSchema instanceof z.ZodObject && iSchema.shape.query
                ? `<% query %>`
                : undefined
          } as any
        },
        input: (value): DaunusAction<T, ExceptionParams<T, P>, E> => ({
          ...action,
          run: makeRun((ctx) => {
            ctx.set("input", iSchema.parse(value));
          })
        }),
        rawInput: (
          value: unknown
        ): DaunusAction<T, ExceptionParams<T, P>, E> => ({
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
