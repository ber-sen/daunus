import {
  QueuingStrategy,
  TransformStream,
  Transformer
} from "web-streams-polyfill";
import { $action } from "../..";

const transform = $action(
  { type: "stream.transform" },
  <I = any, O = any>(params: {
    transformer?: Transformer<I, O>;
    writableStrategy?: QueuingStrategy<I>;
    readableStrategy?: QueuingStrategy<O>;
  }) => {
    return new TransformStream(
      params.transformer,
      params.writableStrategy,
      params.readableStrategy
    );
  }
);

export default transform;
