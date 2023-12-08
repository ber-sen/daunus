import { z } from './zod';

export type TineVar<T> = T & ((ctx: TineCtx) => Promise<T>);

export type TineParams<T> = T; // TODO: fix type

export type TineInput<T> = z.ZodType<T> & { name: string };

export type TineCtx = Map<any, any>;

export type ResolveTineVar<T> = T extends TineVar<infer U>
  ? U extends TineVar<infer Z>
    ? Z
    : U extends Array<infer A>
    ? Array<ResolveTineVar<A>>
    : U extends object
    ? {
        [K in keyof U]: ResolveTineVar<U[K]>;
      }
    : U
  : T extends Array<infer A>
  ? Array<ResolveTineVar<A>>
  : T extends Date
  ? T
  : T extends object
  ? {
      [K in keyof T]: ResolveTineVar<T[K]>;
    }
  : T;

export type TineActionInfo<D> = {
  name: string;
  type: string;
  params: any;
  data?: ResolveTineVar<D>;
  error?: Error;
};

export type TineActionRunOptions<T> = {
  onComplete?: (actionInfo: TineActionInfo<T>, ctx: TineCtx) => void;
};

export type TineAction<T> = {
  name: string;
  run: (
    ctx?: TineCtx,
    options?: TineActionRunOptions<T>,
  ) => Promise<ResolveTineVar<T>>;
};

export type TineWorkflowAction<T> = {
  type: [string];
  params?: T;
  name?: string;
};

export type TineActionWithInput<I, O> = {
  meta: {
    input: z.ZodType<I>;
    output?: z.ZodType<O>;
  };
  input: (value: I) => TineAction<O>;
  rawInput: (value: unknown) => TineAction<O>;
};

export type TineActionWithOptions<O> = TineAction<O> & {
  noInput: () => TineAction<O>;
  withInput: <I>(inputSchema: TineInput<I>) => TineActionWithInput<I, O>;
} & {
  meta: {
    output?: z.ZodType<O>;
  };
};

export type TineActionOptions = {
  ctx: TineCtx;
  parseParams: <X>(ctx: Map<string, any>, params: X) => Promise<X>;
};

export type TineInferReturn<
  T extends TineAction<any> | TineActionWithInput<any, any>,
> = T extends TineActionWithInput<any, any>
  ? Awaited<ReturnType<ReturnType<T['input']>['run']>>
  : T extends TineAction<any>
  ? Awaited<ReturnType<T['run']>>
  : never;

export type TineInferInput<T extends TineActionWithInput<any, any>> =
  T extends TineActionWithInput<any, any> ? Parameters<T['input']>[0] : never;

export class StatusError extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'StatusError';
    this.status = status;
  }
}

type WaitParams =
  | {
      delay: number;
      ctx: Map<any, any>;
    }
  | {
      until: Date;
      ctx: Map<any, any>;
    };

export class Wait extends Error {
  public params: WaitParams;

  constructor(params: WaitParams) {
    super('Wait');
    this.params = params;
  }
}
