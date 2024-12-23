import { Action } from "./new_types"

export function toCamelCase(input: string): string {
  return input
    .replace(/[\s!,._-]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(/^[A-Z]/, (match) => match.toLowerCase())
}

export function isAction(obj: any): obj is Action<any, any> {
  return obj && typeof obj.run === "function"
}
