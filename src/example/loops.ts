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
const items = $iterate($var(input, "body"));

// @ts-ignore
const notifySlackChannal = sendToSlack(
  {
    channel: "#general",
    // @ts-ignore
    text: $var(items, "value.text")
  },
  { scope: items }
);

// @ts-ignore
const action = items.map({
  each: $var(notifySlackChannal)
});

const useCase = action.createRoute(input);

export default useCase;
