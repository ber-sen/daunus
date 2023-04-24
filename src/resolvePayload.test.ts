import { z } from 'zod';
import { tineInput } from './tineHelpers';
import { resolvePayload } from './resolvePayload';
import { tineVar } from './tineVar';

describe('resolvePayload', () => {
  const input = tineInput(z.string(), { name: 'input' });

  const ctx = new Map();

  const inputValue = 'bar';

  ctx.set(input.name, inputValue);

  it('should work with an object', async () => {
    const ctx = new Map();
    const payload = { foo: 'bar' };

    const res = await resolvePayload(ctx, payload);

    expect(res).toStrictEqual(payload);
  });

  it('should resolve value of tineVar inside an object', async () => {
    const payload = { foo: tineVar(input) };

    const res = await resolvePayload(ctx, payload);

    expect(res).toStrictEqual({ foo: inputValue });
  });

  it('should work in case tineVar is the payload', async () => {
    const payload = tineVar(input);

    const res = await resolvePayload(ctx, payload);

    expect(res).toStrictEqual(inputValue);
  });

  it('should work in case tineVar is in array', async () => {
    const payload = [3, tineVar(input)];

    const res = await resolvePayload(ctx, payload);

    expect(res).toStrictEqual([3, inputValue]);
  });

  it('should work in case tineVar is as a nested value in object ', async () => {
    const payload = { level1: { level2: tineVar(input) } };

    const res = await resolvePayload(ctx, payload);

    expect(res).toStrictEqual({ level1: { level2: inputValue } });
  });

  it('should work in case tineVar is as a nested value in array ', async () => {
    const payload = [[[tineVar(input)]]];

    const res = await resolvePayload(ctx, payload);

    expect(res).toStrictEqual([[[inputValue]]]);
  });

  it('should work in case tineVar is as a nested value in array inside a nested object', async () => {
    const payload = { level1: { level2: [[[tineVar(input)]]] } };

    const res = await resolvePayload(ctx, payload);

    expect(res).toStrictEqual({ level1: { level2: [[[inputValue]]] } });
  });

  it('should allow functions in payload', async () => {
    const payload = { someFunc: () => 'foo' };

    const res = await resolvePayload(ctx, payload);

    expect(res).toStrictEqual(payload);
  });

  it('should work if undefined is passed as payload', async () => {
    const res = await resolvePayload(ctx, undefined);

    expect(res).toStrictEqual(undefined);
  });

  it('should work if null is passed as payload', async () => {
    const res = await resolvePayload(ctx, null);

    expect(res).toStrictEqual(null);
  });

  it('should work if empty object is passed as payload', async () => {
    const res = await resolvePayload(ctx, {});

    expect(res).toStrictEqual({});
  });

  it('should work if empty array is passed as payload', async () => {
    const res = await resolvePayload(ctx, []);

    expect(res).toStrictEqual([]);
  });

  it('should work with date', async () => {
    const date = new Date();

    const res = await resolvePayload(ctx, [date]);

    expect(res).toStrictEqual([date]);
  });
});
