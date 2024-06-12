import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import {
  ZodOpenAPIMetadata,
  ZodOpenApiFullMetadata
} from "@asteasolutions/zod-to-openapi/dist/zod-extensions";
import { ZodTypeAny, z } from "zod";

extendZodWithOpenApi(z);

declare module "zod" {
  interface ZodTypeDef {
    openapi?: ZodOpenApiFullMetadata;
  }

  interface ZodType<
    Output = any,
    Def extends ZodTypeDef = ZodTypeDef,
    Input = Output
  > {
    openapi<T extends ZodTypeAny>(
      this: T,
      metadata: Partial<ZodOpenAPIMetadata<z.input<T>>>
    ): T;

    openapi<T extends ZodTypeAny>(
      this: T,
      refId: string,
      metadata?: Partial<ZodOpenAPIMetadata<z.input<T>>>
    ): T;
  }
}

// eslint-disable-next-line unicorn/prefer-export-from
export { z };

const PRIMITIVES = new Set(["number", "boolean"]);

export function getType(rawType: string) {
  if (PRIMITIVES.has(rawType)) {
    return `z.coerce.${rawType}()`;
  }

  return `z.string()`;
}

export function getEncodedType(type: string) {
  if (type.includes("coerce")) {
    return type.split("z.coerce.")[1].replace(/\(\)/g, "");
  }

  return type.split("z.")[1].replace(/\(\)/g, "");
}
