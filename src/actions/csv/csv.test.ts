import { ReadableStream } from "isomorphic-web-streams";
import { $ctx } from "../..";
import csv from ".";

describe("encode", () => {
  it("should with simple encode", async () => {
    const rows = new ReadableStream({
      start(controller) {
        controller.enqueue({ name: "Alice", age: 30 });
        controller.enqueue({ name: "Bob", age: 25 });
        controller.enqueue({ name: "Charlie", age: 35 });
        controller.close();
      }
    });

    const action = await csv({
      rows
    }).run($ctx());

    expect(await new Response(action.data).text()).toStrictEqual(
      "name,age\r\nAlice,30\r\nBob,25\r\nCharlie,35"
    );
  });
});
