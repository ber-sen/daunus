import { TineCtx, TineVar } from "./types";
import { get } from "./get";

export function tineQuery<R>(selector: ($: any) => R | Promise<R>): TineVar<R> {
  const tineVar = async (ctx: TineCtx) => {
    const $ = new Proxy(ctx, {
      get(target, name) {
        return get(target, name as string);
      }
    });

    return await selector($);
  };

  tineVar.toString = () => `{{ ${selector.toString()} }}`;
  tineVar.toJSON = () => `{{ ${selector.toString()} }}`;
  tineVar.__type = "tineVar";

  return tineVar as any;
}
