import { $ctx } from "../../..";
import csv from ".";

describe("encode", () => {
  it("simple encode", async () => {
    const action = await csv({
      rows: [
        { hello: "world", foo: "bar" },
        { hello: "world 2", foo: "bar 2" }
      ]
    }).run($ctx());

    const data = await new Response(action.data).text();

    expect(data).toStrictEqual("hello,foo\r\nworld,bar\r\nworld 2,bar 2");
  });
});
