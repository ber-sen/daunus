import { toCamelCase } from "./new_helpers";
import { FormatScope, ValidateName } from "./type_helpers";
import { DaunusCtx } from ".";

export interface Action<R, I = unknown> {
  run: I extends object
    ? (input: I, ctx?: Map<string, any>) => R
    : (ctx?: Map<string, any>) => R;
}

type WorkflowBackoff = "constant" | "linear" | "exponential";

export interface StepConfig<N, L> {
  name: ValidateName<N, L>;
  retries?: {
    limit: number;
    delay: string | number;
    backoff?: WorkflowBackoff;
  };
  timeout?: string | number;
}

type Steps<R extends Record<string, any>> = {
  [K in keyof R]: R[K] & {
    meta: {
      name: K;
      fn: ($: any) => R[K];
    };
  };
};

class LazyGlobal<Value> {
  public run: (ctx: DaunusCtx) => Value;

  constructor(fn: (ctx: DaunusCtx) => Value) {
    this.run = fn;
  }
}

export class Scope<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> {
  public global: Global;
  public local: Local;
  public steps: Steps<Local>;

  constructor({
    global,
    local,
    steps
  }: {
    global?: Global;
    local?: Local;
    steps?: Steps<Local>;
  }) {
    this.global = global ?? ({} as Global);
    this.local = local ?? ({} as Local);
    this.steps = steps ?? ({} as Steps<Local>);
  }

  addGlobal<Name extends string, Value>(name: Name, value: Value) {
    return new Scope<Global & Record<Name, Value>, Local>({
      global: { ...this.global, [name]: value },
      local: this.local,
      steps: this.steps
    });
  }

  addLazyGlobal<Name extends string, Value>(
    name: Name,
    fn: (ctx: DaunusCtx) => Value
  ) {
    return new Scope<Global & Record<Name, Value>, Local>({
      global: { ...this.global, [name]: new LazyGlobal(fn) },
      local: this.local,
      steps: this.steps
    });
  }

  getGlobal(ctx: DaunusCtx) {
    return Object.fromEntries(
      Object.entries(this.global).map(([key, value]) => {
        if (value instanceof LazyGlobal) {
          return [key, value.run(ctx)];
        }

        return [key, value];
      })
    );
  }

  addLocal<Name extends string, Value>(name: Name, value: Value) {
    return new Scope<Global, Local & Record<Name, Value>>({
      global: this.global,
      local: { ...this.local, [name]: value },
      steps: this.steps
    });
  }

  addStep<Name extends string, Value>(
    nameOrConfig: ValidateName<Name, Local> | StepConfig<Name, Local>,
    fn: ($: FormatScope<Global>) => Value | Promise<Value>
  ) {
    const name =
      typeof nameOrConfig === "string" ? nameOrConfig : nameOrConfig.name;

    const step = (scope: any) => {
      return fn(scope);
    };

    step.meta = {
      name,
      fn
    };

    return new Scope<Global, Local & Record<Name, Value>>({
      global: this.global,
      local: this.local,
      steps: { ...this.steps, [toCamelCase(name)]: step }
    });
  }

  get<Name extends keyof Local>(
    name: Extract<Name, string>,
    global?: Record<any, any>
  ): Local[Name] {
    return this.steps[toCamelCase(name)](global);
  }
}

export interface AbstractStepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> {
  scope: Scope<FormatScope<Global>, FormatScope<Local>>;

  get(name: string, scope?: Record<any, any>): any;

  add(...params: any): any;
}

export interface StepFactory<
  Global extends Record<string, any> = {},
  Local extends Record<string, any> = {}
> extends AbstractStepFactory<Global, Local> {
  get<N extends keyof Local>(name: N, scope?: Record<any, any>): Local[N];
}

export const resultKey: unique symbol = Symbol("resultKey");

export interface StepOptions {
  stepsType?: "default" | "parallel" | "serial";
}
