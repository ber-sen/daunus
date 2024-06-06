import { $fn, struct, condition, $var, exit } from "../";

const error = exit({
  status: 404,
  data: {
    error: "Resouce not found"
  }
});

const random = struct($fn(() => Math.random()));

const success = struct({ success: true });

const res = condition({
  if: $var(random, (val) => val > 0),
  do: $var(success),
  else: $var(error)
});

export default error.noParams();
