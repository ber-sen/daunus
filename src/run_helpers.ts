import { $ctx } from "./daunus_helpers";

export const getContext = (...args: any) => {
  if (args.length === 0) {
    return $ctx();
  }

  if (args.length === 1) {
    if (args[0] instanceof Map) {
      return args[0];
    }

    if (args[0] instanceof Object) {
      return $ctx().set("input", args[0]);
    }
  }

  if (args.length === 2) {
    return args[1].set("input", args[0]);
  }
};
