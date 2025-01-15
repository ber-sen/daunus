import { type Event } from "./types"
export class Exception<
  Status extends number = 500,
  Data = undefined,
  Paths = undefined
> {
  public status: Status
  public data: Data
  public paths: Paths
  public type = "exception"

  constructor(options?: { status?: Status; data?: Data; paths?: Paths }) {
    this.status = options?.status ?? (500 as Status)
    this.data = options?.data as Data
    this.paths = options?.paths as Paths
  }
}

export class GracefulException<
  S extends number = 500,
  D = undefined,
  P = undefined
> extends Exception<S, D, P> {
  public type = "graceful"
}

export class ShutdownException<
  S extends number = 500,
  D = undefined,
  P = undefined
> extends Exception<S, D, P> {
  public type = "shutdown"
}

type WaitParams<Type, Params> =
  | {
      delay: string
    }
  | {
      until: Date
    }
  | Event<Type, Params>

export class Wait<Type, Params> extends ShutdownException<
  102,
  WaitParams<Type, Params>
> {
  constructor(params: WaitParams<Type, Params>) {
    super({ status: 102, data: params })
  }
}

export class Return<
  Data,
  Status extends number = 200
> extends ShutdownException<Status, Data> {
  constructor({ status, data }: { status: Status; data: Data }) {
    super({ status: status ?? 200, data })
  }
}
