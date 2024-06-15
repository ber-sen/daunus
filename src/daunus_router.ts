import { $action } from "./daunus_action";
import { DaunusActionWithInput, RouterFactory } from "./types";
import { z } from "./zod";

export const $router = <
  R extends Record<
    string,
    {
      action: DaunusActionWithInput<any, any, any, any>;
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
  > = {},
  AI extends any | undefined = undefined,
  AR extends any | undefined = undefined
>(
  options: { name?: string } = {},
  defs?: R
): RouterFactory<R, AI, AR> => {
  const add = <N extends string, I extends z.AnyZodObject, D, P, E>(
    name: N,
    action: DaunusActionWithInput<I, D, P, E>
  ) => {
    return $router<
      R & Record<N, { action: DaunusActionWithInput<I, D, P, E> }>,
      AI | I["_output"],
      AR | D
    >(options, {
      ...(defs || ({} as R)),
      [name]: { action }
    });
  };

  const get = <N extends keyof R>(name: N): R[N]["action"] => {
    return {
      ...defs![name]
    }.action;
  };

  const input = z.custom<Exclude<AI, undefined>>();

  const action = $action(
    { type: "router", ...options },
    ({ ctx }) =>
      async () => {
        const inputData = ctx.get("input");

        const match = Object.entries(defs || {}).find(([_, item]) => {
          const { success } = item.action?.meta.iSchema.safeParse(inputData);

          return success;
        });

        if (match) {
          const res = await match[1].action.input(inputData).run(ctx);

          return res.data ?? res.exception;
        }

        return undefined;
      }
  );

  const router = action(defs).withParams(input);

  return {
    ...router,
    add,
    get
  };
};
