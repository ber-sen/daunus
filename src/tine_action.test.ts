import { tineInput } from "./tine_helpers";
import { struct } from "./actions";
import { tineVar } from "./tine_var";
import { TineInferInput, TineInferReturn } from "./types";
import { z } from "./zod";
import { tineAction } from ".";

type Expect<T extends true> = T;

type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2
    ? true
    : false;

describe("tineQuery", () => {
  it("Should infer input", () => {
    const input = tineInput({
      id: z.string()
    }).openapi("User");

    const test = struct({ success: true, data: tineVar(input, "id") });

    const res = test.withParams(input, {
      oSchema: z.object({ success: z.boolean(), data: z.string() })
    });

    type A = TineInferInput<typeof res>;

    type test = Expect<Equal<A, { id: string }>>;
  });

  it("Should infer return", () => {
    const input = tineInput({
      id: z.string()
    }).openapi("User");

    const test = struct({ success: true, data: tineVar(input, "id") });

    const res = test.withParams(input, {
      oSchema: z.object({ success: z.boolean(), data: z.string() })
    });

    type A = TineInferReturn<typeof res>;

    type test = Expect<
      Equal<A, { data: { success: boolean; data: string }; error: never }>
    >;
  });

  it("Should return api props", () => {
    const input = tineInput({
      id: z.string()
    }).openapi("User");

    const test = struct({ success: true, data: tineVar(input, "id") });

    const res = test.withParams(input, {
      oSchema: z.object({ success: z.boolean(), data: z.string() }),
      openApi: {
        params: {
          id: tineVar(input, "id")
        }
      }
    });

    expect(JSON.stringify(res.meta.openApi)).toEqual(
      '{"params":{"id":"{{ id }}"}}'
    );
  });

  it("Should work with container", () => {
    const test = tineAction(
      { type: "test" },
      (payload: string) => payload,
      async (r) => {
        return (await r()).length;
      }
    )("test");

    type A = TineInferReturn<typeof test>;

    type test = Expect<Equal<A, { data: number; error: never }>>;
  });
});
