import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import {
  ZodOpenAPIMetadata,
  ZodOpenApiFullMetadata
} from "@asteasolutions/zod-to-openapi/dist/zod-extensions"
import { ZodTypeAny, z } from "zod"

extendZodWithOpenApi(z)

declare module "zod" {
  interface ZodTypeDef {
    openapi?: ZodOpenApiFullMetadata
  }

  interface ZodType<
    Output = any,
    Def extends ZodTypeDef = ZodTypeDef,
    Input = Output
  > {
    openapi<T extends ZodTypeAny>(
      this: T,
      metadata: Partial<ZodOpenAPIMetadata<z.input<T>>>
    ): T

    openapi<T extends ZodTypeAny>(
      this: T,
      refId: string,
      metadata?: Partial<ZodOpenAPIMetadata<z.input<T>>>
    ): T
  }
}

// eslint-disable-next-line unicorn/prefer-export-from
export { z }
