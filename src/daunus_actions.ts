import { type ActionFactory } from "."

export type ActionsFactory<Registry extends Record<string, any> = {}> = {
  add<Name extends string, Value extends ActionFactory<any, any, any>>(
    name: Name,
    value: Value
  ): ActionsFactory<Registry & Record<Name, Value>>
} & (<Name extends keyof Registry>(name: Name) => Registry[Name])

export function $actions<Registry extends Record<string, any> = {}>(
  registry?: Registry
): ActionsFactory<Registry> {
  function add(name: any, value: any): any {
    return $actions({
      ...registry,
      [name]: value
    })
  }

  function get(name: any): any {
    return registry?.[name]
  }

  get.add = add

  return get
}
