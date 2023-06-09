import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { isMapLike } from './helpers';
import { resolvePayload } from './resolvePayload';
import {
  ResolveTineVar,
  TineAction,
  TineActionInfo,
  TineActionOptions,
  TineActionRunOptions,
  TineActionWithOptions,
  TineCtx,
  TineInput,
  TinePayload,
} from './types';

export const tineAction =
  <P, D>(
    run: (
      payload: P | undefined,
      { ctx, parsePayload }: TineActionOptions,
    ) => D | Promise<D>,
    args: {
      action: string;
      name?: string;
      schema?: z.Schema<P>;
      skipParse?: boolean;
      parseResponse?: boolean;
      skipLog?: boolean;
    },
  ) =>
  (
    payload?: TinePayload<P>,
    actionCtx?: { name?: string; skipLog?: boolean },
  ) => {
    const name: string = actionCtx?.name || args.name || uuidv4();
    const skipLog = actionCtx?.skipLog || args.skipLog || false;

    const actionInfo: TineActionInfo<D> = {
      id: uuidv4(),
      name,
      action: args.action,
      payload: null,
      data: null,
      error: null,
    };

    const makeRun =
      (init?: (ctx: TineCtx) => void) =>
      async (ctx: TineCtx = new Map(), options?: TineActionRunOptions<D>) => {
        if (!ctx.has('actions')) {
          ctx.set('useCase', actionInfo);
          ctx.set('actions', new Map());
        }

        const runFn = async () => {
          init && init(ctx);

          const parsedPayload =
            args.skipParse || !payload
              ? payload
              : await parsePayload(ctx, payload, {
                  schema: args.schema,
                });

          actionInfo.payload = parsedPayload;

          const value = await run(parsedPayload, { ctx, parsePayload });

          if (!args.parseResponse) {
            return resolveTineVar(value);
          }

          const parseValue = await parsePayload(ctx, value);

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

    const action = {
      ...actionCtx,
      name,
      run: makeRun(),
    } satisfies TineAction<D>;

    return {
      ...action,
      noInput: () => action,
      withInput: <I>(inputSchema: TineInput<I>) => ({
        inputSchema,
        input: (value: I) => ({
          ...action,
          run: makeRun((ctx) => {
            ctx.set(inputSchema.name, inputSchema.parse(value));
          }),
        }),
        rawInput: (value: unknown) => ({
          ...action,
          run: makeRun((ctx) => {
            ctx.set(
              inputSchema.name,
              isMapLike(value)
                ? Object.fromEntries(value as any)
                : inputSchema.parse(value),
            );
          }),
        }),
      }),
    } satisfies TineActionWithOptions<D>;
  };

export const parsePayload = async <T>(
  ctx: Map<string, any>,
  payload: TinePayload<T>,
  options?: {
    schema?: z.Schema<T>;
  },
) => {
  const resolvedPayload = await resolvePayload(ctx, payload);

  if (!options?.schema) {
    return resolvedPayload as T;
  }

  return options?.schema.parse(resolvedPayload) as T;
};

const resolveTineVar = <T>(data: T) => data as ResolveTineVar<T>;
