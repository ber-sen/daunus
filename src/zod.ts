import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

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
