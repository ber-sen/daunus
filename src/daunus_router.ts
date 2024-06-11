import { $action } from "./daunus_action";
import { DaunusActionWithInput, Empty, RouterFactory } from "./types";
import { z } from "./zod";

export const $router = <
  R extends Record<
    string,
    {
      action: DaunusActionWithInput<any, any, any, any>;
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
  > = {},
  AI extends any | typeof Empty = typeof Empty,
  AR extends any | typeof Empty = typeof Empty
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
      [name]: { route: { action } }
    });
  };

  const get = <N extends keyof R>(name: N): R[N]["action"] => {
    return {
      ...defs![name]
    }.action;
  };

  const action = $action(
    { type: "router", ...options },
    () => (defs: R | undefined) => {
      return {} as any;
    }
  );

  const router = action(defs).withParams(z.custom<Exclude<AI, typeof Empty>>());

  return {
    ...router,
    add,
    get
  };
};
