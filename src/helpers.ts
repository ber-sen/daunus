import { get } from "./get"
import { type NonUndefined, type ToCamelCase } from "./types_helpers"

import { Exception } from "./daunus_exception"
import {
  type Action,
  type Ctx,
  type ExtractExceptions,
  type Query
} from "./types"

export function toCamelCase<T extends string>(
  input: T
): Uncapitalize<ToCamelCase<T>> {
  return input
    .replace(/[\s!,._-]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(/^[A-Z]/, (match) => match.toLowerCase()) as any
}

export const isObject = (value: any): value is object =>
  value === null ||
  Array.isArray(value) ||
  typeof value === "function" ||
  value instanceof Set ||
  value instanceof Map ||
  value?.constructor === Date
    ? false
    : typeof value === "object"

export const isDaunusQuery = (value: any) =>
  typeof value === "function" && value.__type === "daunus_query"

export const isDaunusPlaceholder = (value: any) =>
  typeof value === "string" && /{{\s*([\S\s]*?)\s*}}/g.test(value)

export const isArray = (value: any): value is any[] => Array.isArray(value)

export const isException = (value: any): value is Exception<any> =>
  value instanceof Exception || value instanceof Error

export const isMapLike = (value: any): value is Map<any, any> => {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.has === "function" &&
    typeof value.get === "function"
  )
}

export function isAction(obj: any): obj is Action<any, any> {
  return obj && typeof obj.run === "function"
}

export const isWorkflowAction = <T>(obj: T): obj is T & { type: [string] } => {
  return (
    isObject(obj) &&
    "type" in obj &&
    isArray(obj.type) &&
    obj.type.length === 1 &&
    typeof obj.type[0] === "string"
  )
}

export const resolveDaunusVar = (ctx: Ctx, $query: Query<any>) => $query(ctx)

export const resolveDaunusPlaceholder = (ctx: Ctx, str: Query<any>) => {
  const $ = new Proxy(ctx, {
    get(target, name) {
      return get(target, name as any)
    }
  })

  if (/^{{\s*([\S\s]*?)\s*}}$/g.test(str)) {
    const match = /^{{\s*([\S\s]*?)\s*}}$/g.exec(str)

    if (match && ctx.has(".daunus-placeholder-resolver")) {
      return ctx.get(".daunus-placeholder-resolver")($, match[1])
    }

    return get({ $ }, match && (match[1].trim() as any))
  }

  const interpolated = str.replace(
    /{{\s*([\S\s]*?)\s*}}/g,
    (_: any, key: string) => {
      if (ctx.has(".daunus-placeholder-resolver")) {
        return ctx.get(".daunus-placeholder-resolver")($, key)
      }

      return get({ $ }, key.trim() as any)
    }
  )

  return interpolated
}

function extractDaunusExceptions<T>(obj: T): Exception<any>[] {
  const daunusExceptions: Exception<any>[] = []

  if (obj instanceof ReadableStream) {
    return daunusExceptions
  }

  function traverseObject(obj: any): void {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key]
        if (value instanceof Exception) {
          daunusExceptions.push(value)
        } else if (typeof value === "object" && value !== null) {
          traverseObject(value)
        }
      }
    }
  }

  traverseObject(obj)
  return daunusExceptions
}

export const parseResult = <Return>(
  data: Return
): {
  data: any
  exception: NonUndefined<ExtractExceptions<Return>>
} => {
  if (Array.isArray(data) && data.length === 2 && isException(data[1])) {
    return {
      data: data[0],
      exception: data[1] as any
    }
  }

  if (isException(data)) {
    return {
      data: undefined as any,
      exception: data as any
    }
  }

  if (isObject(data)) {
    const errors = extractDaunusExceptions(data)

    if (errors[0]) {
      return {
        data: undefined as any,
        exception: errors[0] as any
      }
    }
  }

  return {
    data: data as any,
    exception: undefined as any
  }
}
