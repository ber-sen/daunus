import { exit, struct } from "./actions";
import { $router } from "./daunus_router";
import {
  $input,
  $var,
  DaunusException,
  DaunusInferReturn,
  Equal,
  Expect,
  z
} from ".";

describe("$router", () => {
  it("should work with multiple routes", async () => {
    const userInput = $input({ body: z.object({ firstName: z.string() }) });

    const user = struct({ name: "user" }).createRoute(userInput);

    const gameInput = $input({ body: z.object({ score: z.number() }) });

    const game = struct({ score: $var(gameInput, "body.score") }).createRoute(
      gameInput
    );

    const errorInput = $input({ body: z.object({ error: z.boolean() }) });

    const error = exit({
      status: 404
    }).createRoute(errorInput);

    const router = $router()
      .add("user", user)
      .add("game", game)
      .add("error", error);

    const data = await router.input({ body: { score: 10 } }).run();

    expect(() => router.meta.iSchema?.parse({ trip: false })).toThrow();
    expect(() =>
      router.meta.iSchema?.parse({ body: { score: "test" } })
    ).toThrow();
    expect(() =>
      router.meta.iSchema?.parse({ body: { score: 4 } })
    ).not.toThrow();

    expect(data).toEqual({ data: { score: 10 }, exeption: undefined });

    type A = DaunusInferReturn<typeof router>;

    type data = Expect<
      Equal<
        A,
        {
          data:
            | {
                name: string;
              }
            | {
                score: number;
              };
          exception: DaunusException<404, unknown>;
        }
      >
    >;
  });

  it("should work with simple inputs", async () => {
    const userInput = $input({ firstName: z.string() });

    const user = struct({ name: "user" }).createRoute(userInput);

    const game = struct({ score: 10 }).createRoute();

    const errorInput = $input({ error: z.boolean() });

    const error = exit({
      status: 404
    }).createRoute(errorInput);

    const makeApi = {
      createInput: (action: any, name: any) => {
        return z.object({
          path: z.literal(`/${name}`),
          body: action?.meta?.iSchema || z.undefined()
        });
      },
      parseInput: (action: any) => {
        return action.body;
      }
    };

    const router = $router(makeApi)
      .add("user", user)
      .add("game", game)
      .add("error", error);

    const data = await router.rawInput({ path: "/game" }).run();

    expect(data).toEqual({ data: { score: 10 }, exeption: undefined });

    type A = DaunusInferReturn<typeof router>;

    type data = Expect<
      Equal<
        A,
        {
          data:
            | {
                name: string;
              }
            | {
                score: number;
              };
          exception: DaunusException<404, unknown>;
        }
      >
    >;
  });
});
