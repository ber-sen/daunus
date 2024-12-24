import { Action } from "./new_types"
import { ToCamelCase } from "./type_helpers"

export function toCamelCase<T extends string>(input: T): Uncapitalize<ToCamelCase<T>> {
  return input
    .replace(/[\s!,._-]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(/^[A-Z]/, (match) => match.toLowerCase()) as any
}

export function isAction(obj: any): obj is Action<any, any> {
  return obj && typeof obj.run === "function"
}
