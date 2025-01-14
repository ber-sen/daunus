import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"
import {
  type ZodOpenAPIMetadata,
  type ZodOpenApiFullMetadata
} from "@asteasolutions/zod-to-openapi/dist/zod-extensions"
import { type ZodTypeAny, z } from "zod"

extendZodWithOpenApi(z)

declare module "zod" {
  interface ZodTypeDef {
    openapi?: ZodOpenApiFullMetadata
  }

  interface ZodType<
    Output = any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Def extends ZodTypeDef = ZodTypeDef,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export { z }
