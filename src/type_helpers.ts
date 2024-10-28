export type ToCamelCase<T extends string> =
  T extends `${infer Left}${infer Delimiter}${infer Right}`
    ? Delimiter extends " " | "_" | "-" | "." | "," | "!"
      ? `${Left}${Capitalize<ToCamelCase<Right>>}`
      : `${Left}${ToCamelCase<`${Delimiter}${Right}`>}`
    : T;

export type FormatExceptions<T> = {
  [K in keyof T as ToCamelCase<Extract<K, string>>]: T[K];
} & {};

export type NestedPretty<T> = {
  [K in keyof T]: NestedPretty<T[K]>;
} & {};

export type FormatScope<T> = {
  [K in keyof T as ToCamelCase<Extract<K, string>>]: K extends "exceptions"
    ? FormatExceptions<T[K]>
    : T[K];
} & {};

export type Overwrite<G, N> = N extends keyof G ? Omit<G, N> : G;

export type DisableSameName<N, L> = N extends keyof L ? never : N;
