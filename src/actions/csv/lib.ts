import { Column } from "./types";

const quote = '"';
const quoteRegex = /"/g;
const delimiter = ",";
const rowDelimiter = "\r\n";
const requiresQuoteRegex = /[\n\r",]/;

export async function writeRows<T>(
  writer: WritableStreamDefaultWriter,
  rows: T[],
  columns: Column<T, keyof T>[]
) {
  const text = new TextEncoder();
  const utf8 = text.encode.bind(text);
  const write = writer.write.bind(writer);

  await write(utf8(columns.map((c) => encodeValue(c.label)).join(delimiter)));

  for (const row of rows) {
    await write(utf8(rowDelimiter));

    let s = "";
    let first = true;
    for (const { key, format } of columns) {
      s += (first ? "" : ",") + encodeValue(format(row[key], row));
      first = false;
    }
    await write(utf8(s));
  }
}

export function encodeValue(value: any): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  if (typeof value === "string") {
    const shouldQuote = requiresQuoteRegex.test(value);
    value = value.replace("\0", "").replace(quoteRegex, '""');
    if (shouldQuote) {
      value = quote + value + quote;
    }
    return value;
  }

  return String(value);
}
