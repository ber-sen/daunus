import { $fn, condition, $var, exit, z, struct } from "../";

const isSuccess = struct($fn(() => Math.random() > 0.5));

const success = struct({ success: true });

const error = exit({
  status: 404,
  data: {
    error: "Resouce not found"
  }
});

const res = condition({
  if: $var(isSuccess),
  do: $var(success),
  else: $var(error)
});

export default res.createRoute(z.undefined());
