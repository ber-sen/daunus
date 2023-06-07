import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { isMapLike } from './helpers';
import { resolvePayload } from './resolvePayload';
import {
  ResolveTineVar,
  TineAction,
  TineActionOptions,
  TineActionWithOptions,
  TineCtx,
  TineInput,
  TinePayload,
} from './types';

export const tineAction =
  <P, D>(
    run: (
      payload: P,
      { ctx, parsePayload }: TineActionOptions,
    ) => D | Promise<D>,
    args: {
      action: string;
      name?: string;
      schema?: z.Schema<P>;
      skipParse?: boolean;
      parseResponse?: boolean;
    },
  ) =>
  (payload?: TinePayload<P>, actionCtx?: { name?: string }) => {
    const name: string = actionCtx?.name || args.name || uuidv4();

    const init = (ctx: TineCtx) => {
      if (!ctx.has('actions')) {
        ctx.set('useCase', {
          name,
          id: uuidv4(),
        });
        ctx.set('actions', new Map());
      }
    };

    const action = {
      ...actionCtx,
      name,
      run: async (ctx: TineCtx = new Map()) => {
        init(ctx);

        const parsedPayload =
          args.skipParse || !payload
            ? payload
            : await parsePayload(ctx, payload, {
                schema: args.schema,
              });

        const value = await run(parsedPayload, { ctx, parsePayload });

        if (!args.parseResponse) {
          ctx.set(name, value);

          return resolveTineVar(value);
        }

        const parseValue = await parsePayload(ctx, value);

        ctx.set(name, parseValue);

        return resolveTineVar(parseValue);
      },
    } satisfies TineAction<D>;

    return {
      ...action,
      noInput: () => action,
      withInput: <I>(inputSchema: TineInput<I>) => ({
        inputSchema,
        input: (value: I) => ({
          ...action,
          run: async (ctx: TineCtx = new Map()) => {
            init(ctx);

            ctx.set(inputSchema.name, inputSchema.parse(value));

            return action.run(ctx);
          },
        }),
        rawInput: (value: unknown) => ({
          ...action,
          run: async (ctx: TineCtx = new Map()) => {
            init(ctx);

            ctx.set(
              inputSchema.name,
              isMapLike(value)
                ? Object.fromEntries(value as any)
                : inputSchema.parse(value),
            );

            return action.run(ctx);
          },
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
