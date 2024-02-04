import { UnknownKeysParam, ZodRawShape, ZodTypeAny, z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { resolveParams } from "./resolve_params";
import {
  ResolveTineVar,
  TineAction,
  TineActionInfo,
  TineActionOptions,
  TineActionRunOptions,
  TineActionWithParams,
  TineCtx,
  TineError,
  TineParams
} from "./types";

import { isError, parseResult } from "./helpers";

export const tineAction =
  <P, O, T = O>(
    args: {
      type: string;
      name?: string;
      paramsSchema?: z.Schema<P>;
      skipParse?: boolean;
      parseResponse?: boolean;
      skipLog?: boolean;
      skipPlaceholders?: boolean;
    },
    run: (params: P, { ctx, parseParams }: TineActionOptions) => O | Promise<O>,
    container: (
      r: (params: P, { ctx, parseParams }: TineActionOptions) => Promise<O> | O,
      args: [P, TineActionOptions]
    ) => Promise<T> = (r, args) => r(...args) as any as Promise<T>
  ) =>
  (
    params: TineParams<P>,
    actionCtx?: {
      name?: string;
      skipLog?: boolean;
    }
  ) => {
    const name: string = actionCtx?.name || args.name || uuidv4();
    const skipLog = actionCtx?.skipLog || args.skipLog || false;

    const actionInfo: TineActionInfo<T, T extends TineError<any> ? T : P> = {
      name,
      type: args.type,
      params: null
    };

    const makeRun =
      (init?: (ctx: TineCtx) => void) =>
      async (
        ctx: TineCtx = new Map(),
        options?: TineActionRunOptions<T, T extends TineError<any> ? T : P>
      ) => {
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

          const value = await container(run, [
            parsedParams!,
            { ctx, parseParams }
          ]);

          if (!args.parseResponse) {
            return value;
          }

          const parseValue = await parseParams(ctx, value, {
            skipPlaceholders: true
          });

          return parseValue;
        };

        try {
          const value = parseResult<T, T extends TineError<any> ? T : P>(
            (await runFn()) as T
          );

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

    const action: TineAction<T, T extends TineError<any> ? T : P> = {
      ...actionCtx,
      name,
      run: makeRun()
    };

    const actionWithOptions: TineActionWithParams<
      T,
      T extends TineError<any> ? T : P
    > = {
      ...action,
      noParams: () => action,
      withParams: <
        W extends ZodRawShape,
        U extends UnknownKeysParam,
        C extends ZodTypeAny,
        O,
        I,
        D,
        Z,
        B,
        Q
      >(
        iSchema: z.ZodObject<W, U, C, O, I>,
        meta?: {
          oSchema?: z.ZodType<ResolveTineVar<D>>;
          openApi?: {
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
        input: (value: I): TineAction<T, T extends TineError<any> ? T : P> => ({
          ...action,
          run: makeRun((ctx) => {
            ctx.set("input", iSchema.parse(value));
          })
        }),
        rawInput: (
          value: unknown
        ): TineAction<T, T extends TineError<any> ? T : P> => ({
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
  params: TineParams<T>,
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
