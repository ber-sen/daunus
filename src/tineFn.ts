import { TineCtx, TineVar } from './types';

export function tineFn<R>(
  selector: (ctx: TineCtx) => R | Promise<R>,
): TineVar<R> {
  return {
    __value: async (ctx: TineCtx) => {
      return await selector(ctx);
    },
  } as any;
}
