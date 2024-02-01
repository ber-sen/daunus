import { tineInput, condition, tineVar, exit, z, struct, tineFn } from "..";
import { TineError } from "../../dist";

const input = tineInput({
  did: z.string().describe("Decentralized Identifier token")
}).openapi("Login Input");

const magicMeta = struct(
  tineFn(() => {
    if (Math.random() > 0.5) {
      return { email: "test@example.com" };
    }

    return new TineError(403, "Forbidden");
  })
);

const user = struct({
  where: { email: tineVar(magicMeta, "email") }
});

const notFound = exit({ status: 404 });

const res = condition({
  if: tineVar(user),
  do: tineVar(struct({ success: true })),
  else: tineVar(notFound)
});

export default res.withParams(input);
