import { type StepProps } from "./daunus-step-props"
import { toCamelCase } from "./helpers"
import { type Ctx, type StepConfig } from "./types"
import { type FormatStepMap, type ValidateName } from "./types-helpers"

class LazyGlobal<Value> {
  public run: (ctx: Ctx) => Value

  constructor(fn: (ctx: Ctx) => Value) {
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
  Local extends Record<string, any> = {},
  StepsMap extends Record<string, any> = {},
> {
  public global: Global
  public stepsMap: FormatStepMap<StepsMap>
  public local: Local
  public steps: Steps<Local>

  constructor(options?: {
    stepsMap?: StepsMap
    global?: Global
    local?: Local
    steps?: Steps<Local>
  }) {
    this.global = options?.global ?? ({} as Global)
    this.local = options?.local ?? ({} as Local)
    this.steps = options?.steps ?? ({} as Steps<Local>)
    this.stepsMap = options?.stepsMap ?? ({} as FormatStepMap<StepsMap>)
  }

  addGlobal<Name extends string, Value>(name: Name, value: Value) {
    return new Scope<Global & Record<Name, Value>, Local, StepsMap>({
      global: { ...this.global, [name]: value },
      local: this.local,
      steps: this.steps
    })
  }

  addLazyGlobal<Name extends string, Value>(
    name: Name,
    fn: (ctx: Ctx) => Value
  ) {
    this.global = { ...this.global, [name]: new LazyGlobal(fn) }

    return this as Scope<Global & Record<Name, Value>, Local, StepsMap>
  }

  getGlobal(ctx: Ctx): Global {
    return Object.fromEntries(
      Object.entries(this.global).map(([key, value]) => {
        if (value instanceof LazyGlobal) {
          return [key, value.run(ctx)]
        }

        return [key, value]
      })
    ) as any
  }

  addLocal<Name extends string, Value>(name: Name, value: Value) {
    this.local = { ...this.local, [name]: value }

    return this as Scope<Global, Local & Record<Name, Value>, StepsMap>
  }

  addStep<Name extends string, Value>(
    nameOrConfig: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: (props: StepProps) => Value | Promise<Value>
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

    return this as Scope<
      Global,
      Local & Record<Name, Value>,
      StepsMap & Record<Name, Global>
    >
  }

  get<Name extends keyof Local>(
    name: Extract<Name, string>,
    props?: StepProps
  ): Local[Name] {
    if (this.steps[toCamelCase(name)]) {
      return this.steps[toCamelCase(name)](props)
    }

    return this.local[toCamelCase(name) as any]
  }
}
