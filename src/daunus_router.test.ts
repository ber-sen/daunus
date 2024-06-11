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

    const user = struct({ name: "user" }).withParams(userInput);

    const gameInput = $input({ body: z.object({ score: z.number() }) });

    const game = struct({ score: $var(gameInput, "body.score") }).withParams(
      gameInput
    );

    const errorInput = $input({ body: z.object({ error: z.boolean() }) });

    const error = exit({
      status: 404
    }).withParams(errorInput);

    const router = $router()
      .add("user", user)
      .add("game", game)
      .add("error", error);

    const data = await router.input({ body: { score: 10 } }).run();

    expect(data).toEqual({ score: 10 });

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
