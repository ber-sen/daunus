import { z } from "zod";

import { condition } from "../actions";
import { $input } from "../daunus_helpers";
import { $var } from "../daunus_var";
import define from "../actions/define";

const originalInput = $input({
  body: z.union([
    z.object({
      type: z.literal("string"),
      text: z.string()
    }),
    z.object({
      type: z.literal("number"),
      number: z.number()
    })
  ])
}).openapi("User");

const input = define({
  isString: $var(originalInput, ($) =>
    $.body.type === "string" ? $.body : undefined
  ),
  isNumber: $var(originalInput, ($) =>
    $.body.type === "number" ? $.body : undefined
  )
});

const res = define({
  success: true,
  data: $var(input, (i) => i.isString?.text)
});

const action = condition({
  if: $var(input, "isString"),
  do: $var(res)
});

const useCase = action.withParams(originalInput);

export default useCase;
