import { z } from "zod";

import { $input } from "./daunus_helpers";
import { resolveParams } from "./resolve_params";
import { $var } from "./daunus_var";
import { DaunusError, DaunusVar, Equal, Expect } from "./types";
import { exit, struct, $action } from ".";

const setContext = (value?: object) => {
  const ctx = new Map();

  ctx.set("input", value);

  return ctx;
};

describe("$var", () => {
  describe("string selector", () => {
    it("should return the value", async () => {
      const input = $input({ name: z.string() });

      const ctx = setContext({ name: "Earth" });

      const res = await resolveParams(ctx, $var(input, "name"));

      expect(res).toStrictEqual("Earth");
    });

    it("should return the value inside nested object", async () => {
      const input = $input({ variables: z.object({ name: z.string() }) });

      const ctx = setContext({ variables: { name: "Earth" } });

      const res = await resolveParams(ctx, $var(input, "variables.name"));

      expect(res).toStrictEqual("Earth");
    });

    it("should return the value inside nested object and array", async () => {
      const input = $input({
        variables: z.object({ names: z.array(z.string()) })
      });

      const ctx = setContext({ variables: { names: ["Earth"] } });

      const res = await resolveParams(ctx, $var(input, "variables.names[0]"));

      expect(res).toStrictEqual("Earth");
    });

    it("should return the string value", () => {
      const input = $input({ name: z.string() });

      expect($var(input, "name").toString()).toStrictEqual("{{ name }}");
    });

    it("should work with union", () => {
      const input = $input({
        nested: z.union([
          z.object({ name: z.string() }),
          z.object({ id: z.number() })
        ])
      });

      const test = $var(input, (i) => {
        if ("name" in i.nested) {
          return i.nested.name;
        }

        return "";
      });

      type A = typeof test;

      type test = Expect<Equal<A, DaunusVar<string>>>;
    });

    it("should pass errors", () => {
      const actionWithError = $action(
        {
          type: "test"
        },
        () => {
          if (Math.random() > 0.5) {
            return new DaunusError(404, "Not found");
          }

          return { message: "Found" };
        }
      );

      const action = actionWithError({});

      const test = $var(action, "message")(new Map());

      type A = Awaited<typeof test>;

      type test = Expect<Equal<A, string | DaunusError<404, undefined>>>;
    });

    it("should pass errors on method selector", () => {
      const actionWithError = $action(
        {
          type: "test"
        },
        () => {
          if (Math.random() > 0.5) {
            return new DaunusError(404, "Not found");
          }

          return { message: "Found" };
        }
      );

      const action = actionWithError({});

      const test = $var(action, ($v) => $v.message)(new Map());

      type A = Awaited<typeof test>;

      type test = Expect<Equal<A, string | DaunusError<404, undefined>>>;
    });

    it("should pass the error in struct", async () => {
      const actionWithError = $action(
        {
          type: "test"
        },
        () => {
          // eslint-disable-next-line no-constant-condition
          if (true) {
            return new DaunusError(404);
          }

          return { message: "Found" };
        }
      );

      const instanceWithError = actionWithError({});

      const action = struct({
        test: {
          couldBeError: $var(instanceWithError, "message")
        }
      });

      const res = await action.run();

      expect(res).toStrictEqual({
        data: undefined,
        error: new DaunusError(404)
      });
    });

    it("should pass the custom errors struct", async () => {
      const actionWithError = $action(
        {
          type: "test"
        },
        (_: string) => {
          // eslint-disable-next-line no-constant-condition
          if (true) {
            return new DaunusError(403);
          }

          return { message: "Found" };
        }
      );

      const action = actionWithError("test");

      const res = await action.run();

      expect(res).toStrictEqual({
        data: undefined,
        error: new DaunusError(403)
      });
    });

    it("should pass error from exit action", async () => {
      const error = exit({ status: 403 });

      const action = struct($var(error));

      const res = await action.run();

      type A = Awaited<typeof res>;

      type res = Expect<
        Equal<A, { data: never; error: DaunusError<403, unknown> }>
      >;

      expect(res).toStrictEqual({
        data: undefined,
        error: new DaunusError(403)
      });
    });

    it("should pass the error in other actions", async () => {
      const actionWithError = $action(
        {
          type: "test"
        },
        () => {
          // eslint-disable-next-line no-constant-condition
          if (true) {
            return new DaunusError(404);
          }

          return { message: "Found" };
        }
      );

      const instanceWithError = actionWithError({});

      const container = $action(
        {
          type: "test"
        },
        <P extends string>(payload: P) => {
          return payload.length;
        }
      );

      const action = container($var(instanceWithError, "message"));

      const res = await action.run();

      type A = Awaited<typeof res>;

      type res = Expect<
        Equal<A, { data: number; error: DaunusError<404, undefined> }>
      >;

      expect(res).toStrictEqual({
        data: undefined,
        error: new DaunusError(404)
      });
    });
  });
});
