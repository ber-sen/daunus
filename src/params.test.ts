import { encodePathParams, parsePathParams } from "./params";

describe("parseParams", () => {
  it("should work with primitives", () => {
    const res = parsePathParams("/id:number/name:string");

    expect(res).toEqual(
      `z.object({ id: z.coerce.number(), name: z.string(), })`
    );
  });

  it("should work with tailing slash", () => {
    const res = parsePathParams("/id:number/name:string/");

    expect(res).toEqual(
      `z.object({ id: z.coerce.number(), name: z.string(), })`
    );
  });

  it("should work with empty value", () => {
    const res = parsePathParams("");

    expect(res).toEqual(`z.object({ })`);
  });

  it("should work with incomplet value", () => {
    const res = parsePathParams("/id");

    expect(res).toEqual(`z.object({ })`);
  });
});

describe("encodeParams", () => {
  it("should encode params", () => {
    const res = encodePathParams(
      `z.object({ id: z.coerce.number(), name: z.string() })`
    );

    expect(res).toEqual(`/id:number/name:string`);
  });

  it("should work with empty params", () => {
    const res = encodePathParams(``);

    expect(res).toEqual(`/`);
  });
});
