import { ToCamelCase } from "./type_helpers"
import { DaunusAction } from "."

export function toCamelCase<T extends string>(
  input: T
): Uncapitalize<ToCamelCase<T>> {
  return input
    .replace(/[\s!,._-]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(/^[A-Z]/, (match) => match.toLowerCase()) as any
}

export function isAction(obj: any): obj is DaunusAction<any, any> {
  return obj && typeof obj.run === "function"
}
