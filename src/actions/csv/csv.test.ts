import { $ctx } from "../..";
import csv from ".";

describe("encode", () => {
  it("should with simple encode", async () => {
    const action = await csv({
      rows: [
        { hello: "world", foo: "bar" },
        { hello: "world 2", foo: "bar 2" }
      ]
    }).run($ctx());

    expect(action.data).toStrictEqual(
      "hello,foo\r\nworld,bar\r\nworld 2,bar 2"
    );
  });

  it("should work with 'pass_streams' flag", async () => {
    const action = await csv({
      rows: [
        { hello: "world", foo: "bar" },
        { hello: "world 2", foo: "bar 2" }
      ]
    }).run($ctx({ pass_strems: true }));

    expect(await new Response(action.data).text()).toStrictEqual(
      "hello,foo\r\nworld,bar\r\nworld 2,bar 2"
    );
  });
});
