import { z } from "zod";

import { $input } from "./daunus_helpers";
import { resolveParams } from "./resolve_params";
import { $query } from ".";

describe("resolveParams", () => {
  const input = $input({ foo: z.string() });

  const ctx = new Map();

  const inputValue = "bar";

  ctx.set("input", { foo: "bar" });

  it("should work with an object", async () => {
    const ctx = new Map();
    const params = { foo: "bar" };

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual(params);
  });

  it("should resolve value of $var inside an object", async () => {
    const params = { foo: $query($ => $.input.foo) };

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual({ foo: inputValue });
  });

  it("should work in case $var is the params", async () => {
    const params = $query($ => $.input.foo);

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual(inputValue);
  });

  it("should work in case $var is in array", async () => {
    const params = [3, $query($ => $.input.foo)];

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual([3, inputValue]);
  });

  it("should work in case $var is as a nested value in object ", async () => {
    const params = { level1: { level2: $query($ => $.input.foo) } };

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual({ level1: { level2: inputValue } });
  });

  it("should work in case $var is as a nested value in array ", async () => {
    const params = [[[$query($ => $.input.foo)]]];

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual([[[inputValue]]]);
  });

  it("should work in case $var is as a nested value in array inside a nested object", async () => {
    const params = { level1: { level2: [[[$query($ => $.input.foo)]]] } };

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual({ level1: { level2: [[[inputValue]]] } });
  });

  it("should allow functions in params", async () => {
    const params = { someFunc: () => "foo" };

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual(params);
  });

  it("should work if undefined is passed as params", async () => {
    const res = await resolveParams(ctx, undefined);

    expect(res).toStrictEqual(undefined);
  });

  it("should work if null is passed as params", async () => {
    const res = await resolveParams(ctx, null);

    expect(res).toStrictEqual(null);
  });

  it("should work if empty object is passed as params", async () => {
    const res = await resolveParams(ctx, {});

    expect(res).toStrictEqual({});
  });

  it("should work if empty array is passed as params", async () => {
    const res = await resolveParams(ctx, []);

    expect(res).toStrictEqual([]);
  });

  it("should work with date", async () => {
    const date = new Date();

    const res = await resolveParams(ctx, [date]);

    expect(res).toStrictEqual([date]);
  });
});
