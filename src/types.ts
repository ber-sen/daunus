import { z } from 'zod';

export type TineVar<T> = T & ((ctx: TineCtx) => Promise<T>);

export type TinePayload<T> = T;

export type TineZodPayload<T extends z.ZodType<any, any, any>> = TinePayload<
  z.TypeOf<T>
>;

export type TineInput<T> = z.ZodType<T> & { name: string };

export type TineCtx = Map<any, any>;

export type TineActionInfo = { id?: string; path?: string };

export type ResolveTineVar<T> = T extends TineVar<infer U>
  ? U extends TineVar<infer Z>
    ? Z
    : U extends Array<infer A>
    ? Array<ResolveTineVar<A>>
    : U extends object
    ? {
        [K in keyof U]: ResolveTineVar<U[K]>;
      }
    : U
  : T extends Array<infer A>
  ? Array<ResolveTineVar<A>>
  : T extends Date
  ? T
  : T extends object
  ? {
      [K in keyof T]: ResolveTineVar<T[K]>;
    }
  : T;

export type TineAction<T> = {
  name: string;
  run: (ctx?: TineCtx) => Promise<ResolveTineVar<T>>;
};

export type TineActionWithInput<T, I> = {
  inputSchema: TineInput<I>;
  input: (value: I) => TineAction<T>;
  rawInput: (value: unknown) => TineAction<T>;
};

export type TineActionWithOptions<T> = TineAction<T> & {
  noInput: () => TineAction<T>;
  withInput: <I>(inputSchema: TineInput<I>) => TineActionWithInput<T, I>;
};

export type TineActionOptions = {
  ctx: TineCtx;
  parsePayload: <X>(ctx: Map<string, any>, payload: X) => Promise<X>;
};

export type TineInferReturn<
  T extends TineAction<any> | TineActionWithInput<any, any>,
> = T extends TineActionWithInput<any, any>
  ? Awaited<ReturnType<ReturnType<T['input']>['run']>>
  : T extends TineAction<any>
  ? Awaited<ReturnType<T['run']>>
  : never;

export type TineInferInput<T extends TineActionWithInput<any, any>> =
  T extends TineActionWithInput<any, any> ? Parameters<T['input']>[0] : never;
