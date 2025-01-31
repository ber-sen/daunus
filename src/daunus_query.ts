import { Exception } from "./daunus_exception"
import { type Ctx, type Query } from "./types"

type NestedMap = Map<string, any> | Record<string, any>

function valueIsObject(value: any): boolean {
  return value instanceof Map || (typeof value === "object" && value !== null)
}

function getValue(target: any, prop: string, receiver: any) {
  if (target instanceof Exception && target.paths) {
    return target.paths[prop]
  }
  if (target instanceof Map) {
    return target.get(prop)
  }
  if (prop in target) {
    return Reflect.get(target, prop, receiver)
  }
  return Reflect.get(target, prop, receiver)
}

function createNestedProxy<T extends NestedMap>(target: T): any {
  return new Proxy(target, {
    get(target, prop, receiver) {
      if (typeof prop !== "string") {
        return Reflect.get(target, prop, receiver)
      }
      const value = getValue(target, prop, receiver)

      return valueIsObject(value) ? createNestedProxy(value) : value
    },

    set(target, prop, value, receiver) {
      if (typeof prop === "string" && target instanceof Map) {
        target.set(prop, value)

        return true
      }
      return Reflect.set(target, prop, value, receiver)
    },

    has(target, prop) {
      return typeof prop === "string" && target instanceof Map
        ? target.has(prop)
        : Reflect.has(target, prop)
    },

    deleteProperty(target, prop) {
      return typeof prop === "string" && target instanceof Map
        ? target.delete(prop)
        : Reflect.deleteProperty(target, prop)
    }
  })
}

export function $query<R>(selector: ($: any) => R | Promise<R>): Query<R> {
  const $query = async (ctx: Ctx) => {
    const $ = createNestedProxy(ctx)

    return await selector($)
  }

  $query.toString = () => `{{ ${selector.toString()} }}`
  $query.toJSON = () => `{{ ${selector.toString()} }}`

  $query.__type = "daunus_query"

  return $query as any
}
