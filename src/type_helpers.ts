export type ToCamelCase<T extends string> =
  T extends `${infer Left}${infer Delimiter}${infer Right}`
    ? Delimiter extends " " | "_" | "-" | "." | "," | "!"
      ? `${Left}${Capitalize<ToCamelCase<Right>>}`
      : `${Left}${ToCamelCase<`${Delimiter}${Right}`>}`
    : T;

export type FormatException<T> = {
  [K in keyof T as ToCamelCase<Extract<K, string>>]: T[K];
} & {};

export type NestedPretty<T> = {
  [K in keyof T]: NestedPretty<T[K]>;
} & {};

export type FormatScope<T> = {
  [K in keyof T as ToCamelCase<Extract<K, string>>]: K extends "exceptions"
    ? FormatException<T[K]>
    : T[K];
} & {};

export type Overwrite<G, N> = N extends keyof G ? Omit<G, N> : G;

export type ValidateName<N, L> = N extends "input"
  ? never
  : N extends "exceptions"
    ? never
    : N extends keyof L
      ? never
      : N;

export type Expect<T extends true> = T;

export type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;
