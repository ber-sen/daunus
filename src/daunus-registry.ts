export type RegistryFactory<Registry extends Record<string, any> = {}> = {
  add<Name extends string, Value>(
    name: Name,
    value: Value
  ): RegistryFactory<Registry & Record<Name, Value>>
} & (<Name extends keyof Registry>(name: Name) => Registry[Name])

export function $registry<Registry extends Record<string, any> = {}>(
  registry?: Registry
): RegistryFactory<Registry> {
  function add(name: any, value: any): any {
    return $registry({
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
