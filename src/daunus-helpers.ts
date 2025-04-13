import { ReadableStream } from "isomorphic-web-streams"
import { z } from "./zod"

import { DEFAULT_ACTIONS } from "./default-actions"
import { ZodFirstPartyTypeKind, ZodNever, ZodObject } from "zod"
import { type distill, type } from "arktype"
import { type TypeParser } from "arktype/internal/type.ts"
import { type Constructor, type array, type conform } from "@ark/util"
import {
  type baseGenericConstraints,
  type Generic,
  type ParameterString,
  type parseValidGenericParams,
  type validateParameterString
} from "arktype/internal/generic.ts"
import {
  type ArgTwoOperator,
  type TupleInfixOperator
} from "arktype/internal/parser/tupleExpressions.ts"
import { type Morph, type Predicate, type TypeMeta } from "@ark/schema"

export const $ctx = (value?: object): Map<any, any> =>
  new Map(Object.entries({ ".defaultActions": DEFAULT_ACTIONS, ...value }))

// TODO: extend input
// $input().http().get("/api/lorem/:id")

export interface ObjectOnlyTypeParser<$ = {}> extends TypeParser<$> {
  <const def extends object, r = type.instantiate<def, $>>(
    def: type.validate<def, $>
  ): r extends infer _ ? _ : never

  <
    const params extends ParameterString,
    const def extends object,
    r = Generic<parseValidGenericParams<params, $>, def, $>
  >(
    params: validateParameterString<params, $>,
    def: type.validate<
      def,
      $,
      baseGenericConstraints<parseValidGenericParams<params, $>>
    >
  ): r extends infer _ ? _ : never

  <
    const zero,
    const one,
    const rest extends array<object>,
    r = type.instantiate<[zero, one, ...rest], $>
  >(
    _0: zero extends object ? zero : type.validate<zero, $>,
    _1: zero extends "keyof"
      ? type.validate<one, $>
      : zero extends "instanceof"
        ? conform<one, Constructor>
        : zero extends "==="
          ? conform<one, unknown>
          : conform<one, ArgTwoOperator>,
    ..._2: zero extends "==="
      ? rest
      : zero extends "instanceof"
        ? conform<rest, readonly Constructor[]>
        : one extends TupleInfixOperator
          ? one extends ":"
            ? [Predicate<distill.In<type.infer<zero, $>>>]
            : one extends "=>"
              ? [Morph<distill.Out<type.infer<zero, $>>, unknown>]
              : one extends "|>"
                ? [type.validate<rest[0], $>]
                : one extends "@"
                  ? [TypeMeta.MappableInput]
                  : [type.validate<rest[0], $>]
          : []
  ): r extends infer _ ? _ : never
}

export const $input = ((shape: any) => {
  const isZodInput = (input: any): input is z.ZodRawShape => {
    return Boolean(
      Object.values(input).find((property) => property instanceof z.ZodAny)
    )
  }

  if (isZodInput(shape)) {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject
    })
  }

  return type(shape)
}) as ObjectOnlyTypeParser<{}> &
  (<T extends z.ZodRawShape>(shape: T) => ZodObject<T, "strict">)

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
