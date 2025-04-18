import { type Exception } from "./daunus-exception"

export type CamelCase<T extends string> =
  T extends `${infer Left}${infer Delimiter}${infer Right}`
    ? Delimiter extends " " | "_" | "-" | "." | "," | "!"
      ? `${Left}${Capitalize<ToCamelCase<Right>>}`
      : `${Left}${CamelCase<`${Delimiter}${Right}`>}`
    : T

export type LowercaseFirst<T extends string> =
  T extends `${infer First}${infer Rest}` ? `${Lowercase<First>}${Rest}` : T

export type ToCamelCase<T extends string> = LowercaseFirst<CamelCase<T>>

export type FormatException<T> = {
  [K in keyof T as ToCamelCase<Extract<K, string>>]: T[K]
} & {}

export type NestedPretty<T> = {
  [K in keyof T]: NestedPretty<T[K]>
} & {}

export type FormatScope<T> = {
  [K in keyof T as ToCamelCase<Extract<K, string>>]: K extends "exceptions"
    ? FormatException<T[K]>
    : T[K]
} & {}

export type FormatStepMap<T> = {
  [K in keyof T as ToCamelCase<Extract<K, string>>]: K extends "exceptions"
    ? FormatException<T[K]>
    : FormatScope<T[K]>
}

export type Overwrite<G, N> = N extends keyof G ? Omit<G, N> : G

export type ValidateName<N, L> = N extends "input"
  ? never
  : N extends "exceptions"
    ? never
    : N extends keyof L
      ? never
      : N

export type Expect<T extends true> = T

export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false

export type NonUndefined<T> = T extends undefined ? never : T

export type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T

export type ExtractExceptions<T> =
  T extends Exception<any, any>
    ? T
    : T extends Array<infer A>
      ? ExtractExceptions<A>
      : T extends object
        ? {
            [K in keyof T]: T[K] extends Exception<any, any>
              ? T[K]
              : ExtractExceptions<T[K]>
          }[keyof T]
        : never

export type ExtractData<Return> = Exclude<Return, Exception<any, any>>
