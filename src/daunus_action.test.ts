import { $input } from "./daunus_helpers";
import { struct } from "./actions";
import { $var } from "./daunus_var";
import { DaunusInferInput, DaunusInferReturn } from "./types";
import { z } from "./zod";
import { $action } from "./daunus_action";

type Expect<T extends true> = T;

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

describe("$query", () => {
  it("Should infer input", () => {
    const input = $input({
      id: z.string()
    }).openapi("User");

    const test = struct({ success: true, data: $var(input, "id") });

    const res = test.withParams(input);

    type A = DaunusInferInput<typeof res>;

    type test = Expect<Equal<A, { id: string }>>;
  });

  it("Should infer return", () => {
    const input = $input({
      id: z.string()
    }).openapi("User");

    const test = struct({ success: true, data: $var(input, "id") });

    const res = test.withParams(input);

    type A = DaunusInferReturn<typeof res>;

    type test = Expect<
      Equal<A, { data: { success: boolean; data: string }; error: never }>
    >;
  });

  it("Should return api props", () => {
    const input = $input({
      id: z.string()
    }).openapi("User");

    const test = struct({ success: true, data: $var(input, "id") });

    const res = test.withParams(input, {
      openapi: {
        params: {
          id: $var(input, "id")
        }
      }
    });

    expect(JSON.stringify(res.meta.openapi)).toEqual(
      '{"params":{"id":"{{ id }}"}}'
    );
  });

  it("Should work with container", () => {
    const test = $action(
      { type: "test" },
      (payload: string) => payload,
      async (r, args) => {
        return (await r(...args)).length;
      }
    )("test");

    type A = DaunusInferReturn<typeof test>;

    type test = Expect<Equal<A, { data: number; error: never }>>;
  });

  it("Should work with env", () => {
    const test = $action(
      {
        type: "test",
        envSchema: z.object({
          API_KEY: z.string()
        })
      },
      (_: string, { env }) => {
        return env.API_KEY;
      }
    )("test");

    type A = DaunusInferReturn<typeof test>;

    type test = Expect<
      Equal<
        A,
        {
          data: string;
          error: never;
        }
      >
    >;
  });
});
