import { ReadableStream } from "isomorphic-web-streams";
import { ZodRawShape } from "zod";
import { z } from "./zod";

import { DEFAULT_ACTIONS } from "./default_actions";

export const $ctx = (value?: object): Map<any, any> =>
  new Map(Object.entries({ ".defaultActions": DEFAULT_ACTIONS, ...value }));

export const $input = z.object;

export const $httpInput = <T extends ZodRawShape>(shape: T) =>
  z.object({ __type: z.literal("http").catch("http"), ...shape });

export const $stream = <T>(
  generator: () =>
    | Generator<T | Promise<T>, void, unknown>
    | AsyncGenerator<T | Promise<T>, void, unknown>
): ReadableStream<T> => {
  return new ReadableStream<T>({
    start(controller) {
      const iterator = generator();

      const isAsync =
        typeof (iterator as AsyncGenerator).next === "function" &&
        typeof (iterator as AsyncGenerator).throw === "function";

      const push = async () => {
        try {
          const result = isAsync
            ? await (iterator as AsyncGenerator<T>).next()
            : (iterator as Generator<T>).next();

          if (result.done) {
            controller.close();
            return;
          }

          const resolvedValue = await Promise.resolve(result.value as T);
          controller.enqueue(resolvedValue);

          await push();
        } catch (error) {
          controller.error(error);
        }
      };

      push();
    }
  });
};

export const $delay = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
