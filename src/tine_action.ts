import { UnknownKeysParam, ZodRawShape, ZodTypeAny, z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { resolveParams } from "./resolve_params";
import {
  ResolveTineVar,
  TineAction,
  TineActionInfo,
  TineActionOptions,
  TineActionRunOptions,
  TineActionWithOptions,
  TineCtx,
  TineParams
} from "./types";
import { parseResult } from "./helpers";

export const tineAction =
  <P, O>(
    args: {
      type: string;
      name?: string;
      paramsSchema?: z.Schema<P>;
      skipParse?: boolean;
      parseResponse?: boolean;
      skipLog?: boolean;
      skipPlaceholders?: boolean;
    },
    run: (params: P, { ctx, parseParams }: TineActionOptions) => O | Promise<O>
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

    const actionInfo: TineActionInfo<O> = {
      name,
      type: args.type,
      params: null,
      data: undefined,
      error: undefined
    };

    const makeRun =
      (init?: (ctx: TineCtx) => void) =>
      async (ctx: TineCtx = new Map(), options?: TineActionRunOptions<O>) => {
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

          const value = await run(parsedParams!, { ctx, parseParams });

          if (!args.parseResponse) {
            return resolveTineVar(value);
          }

          const parseValue = await parseParams(ctx, value, {
            skipPlaceholders: true
          });

          return resolveTineVar(parseValue);
        };

        try {
          const value = parseResult(await runFn());

          ctx.set(name, value);
          actionInfo.data = value.data;
          actionInfo.error = value.error ?? null;

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

    const action: TineAction<O> = {
      ...actionCtx,
      name,
      run: makeRun()
    };

    return {
      ...action,
      noParams: (meta?) => ({
        meta: { ...meta },
        ...action
      }),
      withParams: <
        T extends ZodRawShape,
        U extends UnknownKeysParam,
        C extends ZodTypeAny,
        O,
        I,
        D,
        P,
        B,
        Q
      >(
        iSchema: z.ZodObject<T, U, C, O, I>,
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
            params?: P;
            body?: B;
            query?: Q;
          };
        }
      ) => ({
        meta: {
          ...meta,
          iSchema
        },
        input: (value: I) => ({
          ...action,
          run: makeRun((ctx) => {
            ctx.set("input", iSchema.parse(value));
          })
        }),
        rawInput: (value) => ({
          ...action,
          run: makeRun((ctx) => {
            ctx.set("input", iSchema.parse(value));
          })
        })
      })
    } satisfies TineActionWithOptions<O>;
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

const resolveTineVar = <T>(data: T) => data as ResolveTineVar<T>;
