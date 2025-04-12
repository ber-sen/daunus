import { ReadableStream } from "isomorphic-web-streams"
import { type z } from "./zod"

import { DEFAULT_ACTIONS } from "./default-actions"
import { ZodFirstPartyTypeKind, ZodNever, ZodObject } from "zod"

export const $ctx = (value?: object): Map<any, any> =>
  new Map(Object.entries({ ".defaultActions": DEFAULT_ACTIONS, ...value }))

// TODO: extend input
// $input().http().get("/api/lorem/:id")

export const $input = <T extends z.ZodRawShape>(
  shape: T
): ZodObject<T, "strict"> =>
  new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create() as any,
    typeName: ZodFirstPartyTypeKind.ZodObject
  }) as any

export const $stream = <T>(
  generator: () =>
    | Generator<T | Promise<T>, void, unknown>
    | AsyncGenerator<T | Promise<T>, void, unknown>
): ReadableStream<T> => {
  return new ReadableStream<T>({
    start(controller) {
      const iterator = generator()

      const isAsync =
        typeof (iterator as AsyncGenerator).next === "function" &&
        typeof (iterator as AsyncGenerator).throw === "function"

      const push = async () => {
        try {
          const result = isAsync
            ? await (iterator as AsyncGenerator<T>).next()
            : (iterator as Generator<T>).next()

          if (result.done) {
            controller.close()
            return
          }

          const resolvedValue = await Promise.resolve(result.value)
          controller.enqueue(resolvedValue)

          await push()
        } catch (error) {
          controller.error(error)
        }
      }

      void push()
    }
  })
}

export const $delay = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
