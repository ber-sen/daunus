import { tineCtx } from "../../tine_helpers";
import { TineError } from "../../types";

import process from "./index";

describe("process", () => {
  it("should work for basic example", async () => {
    const action = process([
      {
        name: "test",
        type: ["struct"],
        params: {
          foo: "bar"
        }
      }
    ]);

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual({ foo: "bar" });
  });

  it("should work with placeholders", async () => {
    const action = process([
      {
        name: "test",
        type: ["struct"],
        params: {
          foo: "bar"
        }
      },
      {
        type: ["struct"],
        params: "{{ $.test.data.foo }}"
      }
    ]);

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual("bar");
  });

  it("should stop on error", async () => {
    const action = process([
      {
        name: "test",
        type: ["struct"],
        params: {
          foo: "bar"
        }
      },
      {
        name: "error",
        type: ["exit"],
        params: {
          status: 404
        }
      },
      {
        type: ["struct"],
        params: "{{ $.test.data.foo }}"
      }
    ]);

    const res = await action.run(tineCtx());

    expect(res.error).toStrictEqual(new TineError(404));
  });

  it("should work handle errors placeholders", async () => {
    const action = process([
      {
        name: "test",
        type: ["struct"],
        params: {
          foo: "bar"
        }
      },
      {
        type: ["struct"],
        params: "{{ $.test.data.foo }}"
      }
    ]);

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual("bar");
  });

  it("should work with nested processes", async () => {
    const ctx = tineCtx();

    ctx.set(".tine-placeholder-resolver", ($: any, key: string) =>
      // eslint-disable-next-line no-new-func
      new Function("$", `return ${key}`)($)
    );

    const action = process([
      {
        name: "test",
        type: ["process"],
        params: [
          {
            type: ["struct"],
            params: "ipsum"
          },
          {
            type: ["struct"],
            params: {
              foo: "bar"
            }
          }
        ]
      },
      {
        type: ["struct"],
        params: {
          foo: '{{ $.test.data.foo + "asd" }}'
        }
      }
    ]);

    const res = await action.run(ctx);

    expect(res.data).toStrictEqual({ foo: "barasd" });
  });
});
