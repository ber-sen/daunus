import { TineCtx, TineVar } from "./types";

export function tineFn<R>(
  selector: (ctx: TineCtx) => R | Promise<R>
): TineVar<R> {
  const tineVar = async (ctx: TineCtx) => {
    return await selector(ctx);
  };

  tineVar.toString = () => `{{ ${selector.toString()} }}`;
  tineVar.toJSON = () => `{{ ${selector.toString()} }}`;
  tineVar.__type = "tineVar";

  return tineVar as any;
}
