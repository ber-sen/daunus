import { z } from 'zod';

import { tineInput } from './tineHelpers';
import { resolveParams } from './resolveParams';
import { tineVar } from './tineVar';
import { tineFn } from './tineFn';

describe('resolveParams', () => {
  const input = tineInput({ foo: z.string() });

  const ctx = new Map();

  const inputValue = 'bar';

  ctx.set('input', { foo: 'bar' });

  it('should work with an object', async () => {
    const ctx = new Map();
    const params = { foo: 'bar' };

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual(params);
  });

  it('should resolve value of tineVar inside an object', async () => {
    const params = { foo: tineVar(input, 'foo') };

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual({ foo: inputValue });
  });

  it('should resolve value of tineVar inside an another tineVar', async () => {
    const params = { foo: tineFn(() => tineVar(input, 'foo')) };

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual({ foo: inputValue });
  });

  it('should work in case tineVar is the params', async () => {
    const params = tineVar(input, 'foo');

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual(inputValue);
  });

  it('should work in case tineVar is in array', async () => {
    const params = [3, tineVar(input, 'foo')];

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual([3, inputValue]);
  });

  it('should work in case tineVar is as a nested value in object ', async () => {
    const params = { level1: { level2: tineVar(input, 'foo') } };

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual({ level1: { level2: inputValue } });
  });

  it('should work in case tineVar is as a nested value in array ', async () => {
    const params = [[[tineVar(input, 'foo')]]];

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual([[[inputValue]]]);
  });

  it('should work in case tineVar is as a nested value in array inside a nested object', async () => {
    const params = { level1: { level2: [[[tineVar(input, 'foo')]]] } };

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual({ level1: { level2: [[[inputValue]]] } });
  });

  it('should allow functions in params', async () => {
    const params = { someFunc: () => 'foo' };

    const res = await resolveParams(ctx, params);

    expect(res).toStrictEqual(params);
  });

  it('should work if undefined is passed as params', async () => {
    const res = await resolveParams(ctx, undefined);

    expect(res).toStrictEqual(undefined);
  });

  it('should work if null is passed as params', async () => {
    const res = await resolveParams(ctx, null);

    expect(res).toStrictEqual(null);
  });

  it('should work if empty object is passed as params', async () => {
    const res = await resolveParams(ctx, {});

    expect(res).toStrictEqual({});
  });

  it('should work if empty array is passed as params', async () => {
    const res = await resolveParams(ctx, []);

    expect(res).toStrictEqual([]);
  });

  it('should work with date', async () => {
    const date = new Date();

    const res = await resolveParams(ctx, [date]);

    expect(res).toStrictEqual([date]);
  });
});
