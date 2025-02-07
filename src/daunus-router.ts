import { type Action } from "./types"
import { type z } from "./zod"

export type DaunusOpenApiMethod =
  | "get"
  | "post"
  | "put"
  | "delete"
  | "patch"
  | "head"
  | "options"
  | "trace"

export type DaunusOpenApi = z.ZodObject<{
  method?: z.ZodType<any>
  contentType?: z.ZodType<any>
  path?: any
  body?: any
  query?: any
}>

export type DaunusRoute<D, P, E, I extends z.ZodType<any>> = {
  meta: {
    iSchema: I
    payload: P
    openapi: {
      method: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["method"]>["_output"]
        : "post"
      contentType: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["contentType"]>["_output"]
        : never
      path: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["path"]>["_output"]
        : never
      body: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["body"]>["_output"]
        : never
      query: I extends DaunusOpenApi
        ? NonNullable<I["shape"]["query"]>["_output"]
        : never
    }
  }
  input: (value: I["_type"]) => Action<D, E>
  rawInput: (value: unknown) => Action<D, E>
}
