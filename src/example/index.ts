import { z } from "zod";

import { struct } from "../actions";
import { $input } from "../daunus_helpers";
import { $var } from "../daunus_var";

const input = $input({
  id: z.string()
}).openapi("User");

const res = struct({ success: true, data: $var(input, "id") });

const useCase = res.createRoute(input);

export default useCase;
