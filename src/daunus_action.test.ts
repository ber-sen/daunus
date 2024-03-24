import { $input } from "./daunus_helpers";
import { struct } from "./actions";
import { $var } from "./daunus_var";
import { DaunusError, DaunusInferInput, DaunusInferReturn } from "./types";
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
      () => (params: string) => params,
      async (fn, options, params) => {
        return (await fn(options)(params)).length;
      }
    )("test");

    type A = DaunusInferReturn<typeof test>;

    type test = Expect<Equal<A, { data: number; error: never }>>;
  });

  it("Should work with array", () => {
    const test = $action({ type: "test" }, () => (payload: string) => {
      if (Math.random() > 0.5) {
        return new DaunusError(500, "Server Error");
      }

      return [{ name: payload }];
    })("test");

    type A = DaunusInferReturn<typeof test>;

    type test = Expect<
      Equal<
        A,
        {
          data: {
            name: string;
          }[];
          error: DaunusError<500, undefined>;
        }
      >
    >;
  });

  it("Should work with env", () => {
    const test = $action(
      {
        type: "test",
        envSchema: z.object({
          API_KEY: z.string()
        })
      },
      ({ env }) =>
        (_: string) => {
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

  it("Should work without env return", () => {
    const test = $action(
      {
        type: "test"
      },
      () => (_: string) => {
        return "test";
      }
    );

    type A = z.infer<NonNullable<ReturnType<typeof test>["envSchema"]>>;

    // eslint-disable-next-line @typescript-eslint/ban-types
    type test = Expect<Equal<A, {}>>;
  });
});
