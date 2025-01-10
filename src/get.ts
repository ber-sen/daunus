type AnyObject<Key extends PropertyKey = PropertyKey, Value = any> = {
  readonly [key in Key]: Value
}

type Paths<P extends string, T> = P | `${P}${NextPath<T>}`

type Position = `[${number}]`

type NextPath<T> = T extends readonly (infer U)[]
  ? Paths<Position, U>
  : T extends Map<any, infer V>
    ? {
        [K in keyof V]-?: K extends string ? `.${K}` : never
      }[keyof V]
    : T extends AnyObject
      ? {
          [K in keyof T]-?: K extends string ? `.${Paths<K, T[K]>}` : never
        }[keyof T]
      : never

export type Path<T> = T extends readonly (infer U)[]
  ? Paths<Position, U>
  : T extends Map<any, infer V>
    ? {
        [K in keyof V]-?: K extends string ? K : never
      }[keyof V]
    : T extends AnyObject
      ? {
          [K in keyof T]-?: K extends string ? Paths<K, T[K]> : never
        }[keyof T]
      : never

type Accessor<T> = Position | Extract<keyof T, string>

type NextTypeAtPath<T, P extends string> = P extends `.${infer P2}`
  ? P2 extends Path<T>
    ? TypeAtPath<T, P2>
    : never
  : P extends Path<T>
    ? TypeAtPath<T, P>
    : never

type TypeAt<T, A extends string> = A extends Position
  ? T extends readonly (infer U)[]
    ? U
    : never
  : A extends keyof T
    ? T[A]
    : T extends Map<any, infer V>
      ? V
      : never

export type TypeAtPath<T, P extends Path<T>> =
  P extends Accessor<T>
    ? TypeAt<Required<T>, P>
    : P extends `${Accessor<T>}${infer P2}`
      ? P extends `${infer A}${P2}`
        ? NextTypeAtPath<TypeAt<Required<T>, A>, P2>
        : never
      : never

export function get<T, P extends Path<T>, U>(
  object: T,
  path: P,
  placeholder: U
): TypeAtPath<T, P> | U

export function get<T, P extends Path<T>>(
  object: T,
  path: P
): TypeAtPath<T, P> | undefined

export function get(data: any, path: string, defaultValue?: any): any {
  const value = path
    .split(/[.[\]]/)
    .filter(Boolean)
    .reduce<any>((value, key) => {
      if (value instanceof Map && typeof value.get === "function") {
        return value.get(key)
      }
      return (value as any)?.[key]
    }, data)

  return value ?? defaultValue
}
