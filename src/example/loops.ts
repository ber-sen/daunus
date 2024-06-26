import { z } from "zod";

import { $input } from "../daunus_helpers";
import { $var } from "../daunus_var";

const input = $input({
  body: z.array(
    z.object({
      type: z.literal("string"),
      text: z.string()
    })
  )
}).openapi("Items");

// @ts-ignore
const items = iterate($var(input, "body"));

// @ts-ignore
const itemsWithName = sendToSlack({
  channel: "#general",
  // @ts-ignore
  text: $var(items, "value.text")
});

// @ts-ignore
const action = map({
  iterate: $var(items),
  do: $var(itemsWithName)
});

const useCase = action.withParams(input);

export default useCase;
