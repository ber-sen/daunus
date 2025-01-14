import { Exception } from "./daunus_exception"
import { type DaunusCtx, type DaunusQuery } from "./types"

type NestedMap = Map<string, any> | Record<string, any>

function createNestedProxy<T extends NestedMap>(target: T): any {
  return new Proxy(target, {
    get(target, prop, receiver) {
      if (
        typeof prop === "string" &&
        target instanceof Exception &&
        target.paths
      ) {
        const value = target.paths[prop]

        if (
          value instanceof Map ||
          (typeof value === "object" && value !== null)
        ) {
          return createNestedProxy(value)
        }

        return value
      }

      if (typeof prop === "string" && target instanceof Map) {
        const value = target.get(prop)
        if (
          value instanceof Map ||
          (typeof value === "object" && value !== null)
        ) {
          return createNestedProxy(value)
        }

        return value
      }

      if (typeof prop === "string" && prop in target) {
        const value = Reflect.get(target, prop, receiver)

        if (
          value instanceof Map ||
          (typeof value === "object" && value !== null)
        ) {
          return createNestedProxy(value)
        }

        return value
      }

      return Reflect.get(target, prop, receiver)
    },

    set(target, prop, value, receiver) {
      if (typeof prop === "string" && target instanceof Map) {
        target.set(prop, value)

        return true
      }

      return Reflect.set(target, prop, value, receiver)
    },

    has(target, prop) {
      if (typeof prop === "string" && target instanceof Map) {
        return target.has(prop)
      }

      return Reflect.has(target, prop)
    },

    deleteProperty(target, prop) {
      if (typeof prop === "string" && target instanceof Map) {
        return target.delete(prop)
      }

      return Reflect.deleteProperty(target, prop)
    }
  })
}

export function $query<R>(
  selector: ($: any) => R | Promise<R>
): DaunusQuery<R> {
  const $query = async (ctx: DaunusCtx) => {
    const $ = createNestedProxy(ctx)

    return await selector($)
  }

  $query.toString = () => `{{ ${selector.toString()} }}`
  $query.toJSON = () => `{{ ${selector.toString()} }}`

  $query.__type = "daunus_query"

  return $query as any
}
