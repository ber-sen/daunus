import { $input, condition, $var, exit, z, struct, DaunusException } from "..";

const input = $input({
  did: z.string().describe("Decentralized Identifier token")
}).openapi("Login Input");

const magicMeta = struct(() => {
  if (Math.random() > 0.5) {
    return { email: "test@example.com" };
  }

  return new DaunusException(403, "Forbidden");
});

const user = struct({
  where: { email: $var(magicMeta, "email") }
});

const notFound = exit({ status: 404 });

const res = condition({
  if: $var(user),
  do: $var(struct({ success: true })),
  else: $var(notFound)
});

export default res.createRoute(input);
