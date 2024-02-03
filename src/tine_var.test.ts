import { z } from "zod";

import { tineInput } from "./tine_helpers";
import { resolveParams } from "./resolve_params";
import { tineVar } from "./tine_var";
import { TineError, TineVar } from "./types";
import { tineAction } from ".";

const setContext = <T>(value?: object) => {
  const ctx = new Map();

  ctx.set("input", value);

  return ctx;
};

type Expect<T extends true> = T;

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

describe("tineVar", () => {
  describe("string selector", () => {
    it("should return the value", async () => {
      const input = tineInput({ name: z.string() });

      const ctx = setContext({ name: "Earth" });

      const res = await resolveParams(ctx, tineVar(input, "name"));

      expect(res).toStrictEqual("Earth");
    });

    it("should return the value inside nested object", async () => {
      const input = tineInput({ variables: z.object({ name: z.string() }) });

      const ctx = setContext({ variables: { name: "Earth" } });

      const res = await resolveParams(ctx, tineVar(input, "variables.name"));

      expect(res).toStrictEqual("Earth");
    });

    it("should return the value inside nested object and array", async () => {
      const input = tineInput({
        variables: z.object({ names: z.array(z.string()) })
      });

      const ctx = setContext({ variables: { names: ["Earth"] } });

      const res = await resolveParams(
        ctx,
        tineVar(input, "variables.names[0]")
      );

      expect(res).toStrictEqual("Earth");
    });

    it("should return the string value", () => {
      const input = tineInput({ name: z.string() });

      expect(tineVar(input, "name").toString()).toStrictEqual("{{ name }}");
    });

    it("should work with union", () => {
      const input = tineInput({
        nested: z.union([
          z.object({ name: z.string() }),
          z.object({ id: z.number() })
        ])
      });

      const test = tineVar(input, (i) => {
        if ("name" in i.nested) {
          return i.nested.name;
        }

        return "";
      });

      type A = typeof test;

      type test = Expect<Equal<A, TineVar<string>>>;
    });

    it("should pass errors", () => {
      const actionWithError = tineAction(
        {
          type: "test"
        },
        () => {
          if (Math.random() > 0.5) {
            return new TineError(404, "Not found");
          }

          return { message: "Found" };
        }
      );

      const action = actionWithError({});

      const test = tineVar(action, "message")(new Map());

      type A = Awaited<typeof test>;

      type test = Expect<Equal<A, string | TineError<404, undefined>>>;
    });

    it("should pass errors on method selector", () => {
      const actionWithError = tineAction(
        {
          type: "test"
        },
        () => {
          if (Math.random() > 0.5) {
            return new TineError(404, "Not found");
          }

          return { message: "Found" };
        }
      );

      const action = actionWithError({});

      const test = tineVar(action, ($v) => $v.message)(new Map());

      type A = Awaited<typeof test>;

      type test = Expect<Equal<A, string | TineError<404, undefined>>>;
    });
  });
});
