import { $steps } from "./daunus_steps"
import { $if } from "./daunus_if"
import { $loop } from "./daunus_loop"
import { toCamelCase } from "./helpers"
import { type StepConfig } from "./new_types"
import { type DaunusCtx } from "./types"
import { type ValidateName } from "./types_helpers"

class LazyGlobal<Value> {
  public run: (ctx: DaunusCtx) => Value

  constructor(fn: (ctx: DaunusCtx) => Value) {
    this.run = fn
  }
}

type Steps<R extends Record<string, any>> = {
  [K in keyof R]: R[K] & {
    meta: {
      name: K
      fn: ($: any) => R[K]
    }
  }
}

export class Scope<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> {
  public global: Global
  public local: Local
  public steps: Steps<Local>

  constructor(options?: {
    global?: Global
    local?: Local
    steps?: Steps<Local>
  }) {
    this.global = options?.global ?? ({} as Global)
    this.local = options?.local ?? ({} as Local)
    this.steps = options?.steps ?? ({} as Steps<Local>)
  }

  addGlobal<Name extends string, Value>(name: Name, value: Value) {
    return new Scope<Global & Record<Name, Value>, Local>({
      global: { ...this.global, [name]: value },
      local: this.local,
      steps: this.steps
    })
  }

  addLazyGlobal<Name extends string, Value>(
    name: Name,
    fn: (ctx: DaunusCtx) => Value
  ) {
    this.global = { ...this.global, [name]: new LazyGlobal(fn) }

    return this as Scope<Global & Record<Name, Value>, Local>
  }

  getGlobal(ctx: DaunusCtx): Global {
    return Object.fromEntries(
      Object.entries(this.global).map(([key, value]) => {
        if (value instanceof LazyGlobal) {
          return [key, value.run(ctx)]
        }

        return [key, value]
      })
    ) as any
  }

  getStepsProps(ctx: DaunusCtx) {
    const global = this.getGlobal(ctx)

    return this.getProps(global)
  }

  addLocal<Name extends string, Value>(name: Name, value: Value) {
    this.local = { ...this.local, [name]: value }

    return this as Scope<Global, Local & Record<Name, Value>>
  }

  getProps(global: Global) {
    return {
      $: global,
      $if: (options: any) => $if({ $: global, ...options }),
      $loop: (options: any) => $loop({ $: global, ...options }),
      $steps: (options: any) => $steps({ $: global, ...options })
    }
  }

  addStep<Name extends string, Value>(
    nameOrConfig: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: any) => Value | Promise<Value>
  ) {
    const name =
      typeof nameOrConfig === "string" ? nameOrConfig : nameOrConfig.name

    const step = (props: any) => {
      return fn(props)
    }

    step.meta = {
      name,
      fn
    }

    this.steps = { ...this.steps, [toCamelCase(name)]: step }

    return this as Scope<Global, Local & Record<Name, Value>>
  }

  get<Name extends keyof Local>(
    name: Extract<Name, string>,
    global?: Record<any, any>
  ): Local[Name] {
    if (this.steps[toCamelCase(name)]) {
      return this.steps[toCamelCase(name)](this.getProps(global ?? {}))
    }

    return this.local[toCamelCase(name) as any]
  }
}
