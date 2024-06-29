import { $action } from "./daunus_action";
import { DaunusRoute, RouterFactory } from "./types";
import { z } from "./zod";

export const $router = <
  R extends Record<
    string,
    {
      route: DaunusRoute<any, any, any, any>;
      input: any;
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
  > = {},
  AI extends any | undefined = undefined,
  AR extends any | undefined = undefined
>(
  options: {
    name?: string;
    createInput?: (action: any, name: string) => any;
    parseInput?: (object: any) => any;
  } = {},
  input: Array<z.ZodAny> = [],
  defs?: R
): RouterFactory<R, AI, AR> => {
  const add = <N extends string, D, P, E, I extends z.ZodTypeAny>(
    name: N,
    route: DaunusRoute<D, P, E, I>
  ) => {
    const newInput = options.createInput
      ? options.createInput(route, name)
      : route.meta.iSchema;

    return $router<
      R & Record<N, { route: DaunusRoute<D, P, E, I> }>,
      AI | I["_output"],
      AR | D
    >(options, [...input.filter(Boolean), newInput] as any, {
      ...(defs || ({} as R)),
      [name]: { route, input: newInput }
    });
  };

  const get = <N extends keyof R>(name: N): R[N]["route"] => {
    return {
      ...defs![name]
    }.route;
  };

  const action = $action(
    { type: "router", ...options },
    ({ ctx }) =>
      async () => {
        const match = Object.entries(defs || {}).find(([_, item]) => {
          const { success } = item.input.safeParse(ctx.get("input"));

          return success;
        });

        if (match) {
          const inputData = options.parseInput
            ? options.parseInput(ctx.get("input"))
            : ctx.get("input");

          const res = await match[1].route.input(inputData).run(ctx);

          return res.data ?? res.exception;
        }

        return undefined;
      }
  );

  const router = action(defs).createRoute(z.union([...(input as any)] as any));

  return {
    ...router,
    add,
    get,
    defs: defs as R
  };
};
