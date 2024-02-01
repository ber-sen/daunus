import { getEncodedType, getType } from "./zod";

export function parsePathQuery(query: string) {
  if (!query.includes("?")) {
    return "z.object({ })";
  }

  const parts = query.split("?")[1].split("&").filter(Boolean);

  const entries = parts
    .filter((item) => item.includes("="))
    .map((part) => part.split("="));

  return `z.object({${entries.reduce((acc, [name, rawType]) => {
    const type = getType(rawType);

    return `${acc} ${name}: ${type},`;
  }, "")} })`;
}

export function encodePathQuery(params: string) {
  if (!params.replace(/\s/, "")) {
    return "?";
  }

  const body = params.split("z.object({")[1].split("})").slice(0, -1).join("");

  const parts = body
    .replace(/\s/g, "")
    .split(",")
    .filter((item) => item.includes(":"))
    .map((item) => item.split(":"));

  return parts
    .reduce((acc, [name, type]) => `${acc}&${name}=${getEncodedType(type)}`, "")
    .replace("&", "?");
}
