import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { isMapLike } from './helpers';
import { resolvePayload } from './resolvePayload';
import {
  TineAction,
  TineActionOptions,
  TineActionWithInput,
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
    args: { action: string; schema?: z.Schema<P>; skipParse?: boolean },
  ) =>
  (payload: TinePayload<P>, actionCtx?: { name?: string }) => {
    const name: string = actionCtx?.name || uuidv4();

    const action = {
      ...actionCtx,
      name,
      run: async (options?: { ctx?: TineCtx }) => {
        const ctx = options?.ctx || new Map();

        const parsedPayload = args.skipParse
          ? payload
          : await parsePayload(ctx, payload, {
              schema: args.schema,
            });

        const value = await run(parsedPayload, { ctx, parsePayload });

        ctx.set(name, value);

        return value;
      },
    } satisfies TineAction<D>;

    return {
      ...action,
      noInput: () => action,
      withInput: <I>(inputSchema: TineInput<I>) =>
        ({
          inputSchema,
          input: (value: I) => ({
            ...action,
            run: async (options?: { ctx?: TineCtx }) => {
              const ctx = options?.ctx || new Map();

              ctx.set(inputSchema.name, inputSchema.parse(value));

              return action.run({ ctx });
            },
          }),
          rawInput: (value: unknown) => ({
            ...action,
            run: async (options?: { ctx?: TineCtx }) => {
              const ctx = options?.ctx || new Map();

              ctx.set(
                inputSchema.name,
                isMapLike(value)
                  ? Object.fromEntries(value as any)
                  : inputSchema.parse(value),
              );

              return action.run({ ctx });
            },
          }),
        } as TineActionWithInput<D, I>),
    } satisfies TineAction<D> & {
      withInput: <I>(inputSchema: TineInput<I>) => TineActionWithInput<D, I>;
      noInput: () => TineAction<D>;
    };
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
