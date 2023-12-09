import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { resolveParams } from './resolveParams';
import {
  ResolveTineVar,
  TineAction,
  TineActionInfo,
  TineActionOptions,
  TineActionRunOptions,
  TineActionWithOptions,
  TineCtx,
  TineParams,
} from './types';

export const tineAction =
  <P, O>(
    args: {
      type: string;
      name?: string;
      paramsSchema?: z.Schema<P>;
      skipParse?: boolean;
      parseResponse?: boolean;
      skipLog?: boolean;
    },
    run: (
      params: P | undefined,
      { ctx, parseParams }: TineActionOptions,
    ) => O | Promise<O>,
  ) =>
  (
    params?: TineParams<P>,
    actionCtx?: {
      name?: string;
      skipLog?: boolean;
    },
  ) => {
    const name: string = actionCtx?.name || args.name || uuidv4();
    const skipLog = actionCtx?.skipLog || args.skipLog || false;

    const actionInfo: TineActionInfo<O> = {
      name,
      type: args.type,
      params: null,
      data: undefined,
      error: undefined,
    };

    const makeRun =
      (init?: (ctx: TineCtx) => void) =>
      async (ctx: TineCtx = new Map(), options?: TineActionRunOptions<O>) => {
        if (!ctx.has('actions')) {
          ctx.set('useCase', actionInfo);
          ctx.set('actions', new Map());
        }

        const runFn = async () => {
          init && init(ctx);

          const parsedParams =
            args.skipParse || !params
              ? params
              : await parseParams(ctx, params, {
                  schema: args.paramsSchema,
                });

          actionInfo.params = parsedParams;

          const value = await run(parsedParams, { ctx, parseParams });

          if (!args.parseResponse) {
            return resolveTineVar(value);
          }

          const parseValue = await parseParams(ctx, value, {
            skipPlaceholders: true,
          });

          return resolveTineVar(parseValue);
        };

        try {
          const value = await runFn();

          ctx.set(name, value);
          actionInfo.data = value;

          if (!skipLog) {
            ctx.get('actions').set(actionInfo.name, actionInfo);
          }

          return value;
        } catch (e) {
          actionInfo.error = e;

          if (!skipLog) {
            ctx.get('actions').set(actionInfo.name, actionInfo);
          }

          throw e;
        } finally {
          if (options?.onComplete) {
            options.onComplete(actionInfo, ctx);
          }
        }
      };

    const action: TineAction<O> = {
      ...actionCtx,
      name,
      run: makeRun(),
    };

    return {
      ...action,
      noParams: (oSchema) => ({
        meta: {
          oSchema,
        },
        ...action,
      }),
      withParams: (iSchema, oSchema?) => ({
        meta: {
          iSchema,
          oSchema,
        },
        input: (value) => ({
          ...action,
          run: makeRun((ctx) => {
            ctx.set('input', iSchema.parse(value));
          }),
        }),
        rawInput: (value) => ({
          ...action,
          run: makeRun((ctx) => {
            ctx.set('input', iSchema.parse(value));
          }),
        }),
      }),
    } satisfies TineActionWithOptions<O>;
  };

export const parseParams = async <T>(
  ctx: Map<string, any>,
  params: TineParams<T>,
  options?: {
    schema?: z.Schema<T>;
    skipPlaceholders?: Boolean;
  },
) => {
  const resolvedParams = await resolveParams(ctx, params, {
    skipPlaceholders: options?.skipPlaceholders,
  });

  if (!options?.schema) {
    return resolvedParams as T;
  }

  return options?.schema.parse(resolvedParams) as T;
};

const resolveTineVar = <T>(data: T) => data as ResolveTineVar<T>;
