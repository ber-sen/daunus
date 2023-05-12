import { z } from 'zod';

export type TineVar<T> = T;

export type TinePayload<T> = T;

export type TineZodPayload<T extends z.ZodType<any, any, any>> = TinePayload<
  z.TypeOf<T>
>;

export type TineInput<T> = z.ZodType<T> & { name: string };

export type TineCtx = Map<any, any>;

export type TineActionInfo = { id?: string; path?: string };

export type TineAction<T> = {
  name: string;
  run: (ctx?: TineCtx) => Promise<T>;
};

export type TineActionWithInput<T, I> = {
  inputSchema: TineInput<I>;
  input: (value: I) => TineAction<T>;
  rawInput: (value: unknown) => TineAction<T>;
};

export type TineActionOptions = {
  ctx: TineCtx;
  parsePayload: <X>(ctx: Map<string, any>, payload: X) => Promise<X>;
};

// TODO: fix type of tine payload

// type Primitive = string | number | boolean | null | undefined;

// export type TineVar<T> = {
//   __value: (ctx: TineCtx) => Promise<T | undefined | ((ctx: TineCtx) => T)>;
// };

// export type TinePayload<T> = T extends Primitive
//   ? TineVar<T> | T
//   : { [K in keyof T]: TinePayload<T[K]> };
