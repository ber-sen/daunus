import { parsePathQuery, encodePathQuery } from "./query";

describe("parseQuery", () => {
  it("should work with primitives", () => {
    const res = parsePathQuery("?id=number&name=string");

    expect(res).toEqual(
      `z.object({ id: z.coerce.number(), name: z.string(), })`
    );
  });

  it("should work with tailing slash", () => {
    const res = parsePathQuery("?id=number&name=string&");

    expect(res).toEqual(
      `z.object({ id: z.coerce.number(), name: z.string(), })`
    );
  });

  it("should work with empty value", () => {
    const res = parsePathQuery("");

    expect(res).toEqual(`z.object({ })`);
  });

  it("should work with incomplet value", () => {
    const res = parsePathQuery("?id");

    expect(res).toEqual(`z.object({ })`);
  });

  it("should work one param", () => {
    const res = parsePathQuery("?id=number");

    expect(res).toEqual(`z.object({ id: z.coerce.number(), })`);
  });
});

describe("encodeParams", () => {
  it("should encode params", () => {
    const res = encodePathQuery(
      `z.object({ id: z.coerce.number(), name: z.string() })`
    );

    expect(res).toEqual(`?id=number&name=string`);
  });

  it("should work with empty params", () => {
    const res = encodePathQuery(``);

    expect(res).toEqual(`?`);
  });
});
