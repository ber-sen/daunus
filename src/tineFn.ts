import { TineCtx, TineVar } from './types';

export function tineFn<R>(
  selector: (ctx: TineCtx) => R | Promise<R>,
): TineVar<R> {
  const caller = async (ctx: TineCtx) => {
    return await selector(ctx);
  };

  caller.___tineVar = true;
  caller.toString = () => '{{tineVar}}';
  caller.toJSON = () => '{{tineVar}}';

  return caller as any;
}
