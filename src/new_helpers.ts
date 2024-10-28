import { Action } from "./new_types";

export function toCamelCase(input: string): string {
  return input
    .replace(/[\s!,._-]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
    .replace(/^[A-Z]/, (match) => match.toLowerCase());
}

export function isAction<T extends string>(obj: any): obj is Action<T, any> {
  return obj && typeof obj.run === "function" && obj.run.type;
}
