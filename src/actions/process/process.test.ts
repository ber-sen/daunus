import process from './index';

describe('process', () => {
  it('should work for basic example', async () => {
    const action = process([
      {
        name: 'test',
        action: ['shape'],
        payload: {
          foo: 'bar',
        },
      },
    ]);

    const res = await action.run();

    expect(res).toStrictEqual({ foo: 'bar' });
  });

  it('should work with placeholders', async () => {
    const action = process([
      {
        name: 'test',
        action: ['shape'],
        payload: {
          foo: 'bar',
        },
      },
      {
        action: ['shape'],
        payload: '{{ $.test.foo }}',
      },
    ]);

    const res = await action.run();

    expect(res).toStrictEqual('bar');
  });

  it('should work with nested processes', async () => {
    const ctx = new Map();

    ctx.set('.tine-placeholder-resolver', ($: any, key: string) =>
      new Function('$', `return ${key}`)($),
    );

    const action = process([
      {
        name: 'test',
        action: ['process'],
        payload: [
          {
            action: ['shape'],
            payload: 'ipsum',
          },
          {
            action: ['shape'],
            payload: {
              foo: 'bar',
            },
          },
        ],
      },
      {
        action: ['shape'],
        payload: {
          foo: '{{ $.test.foo + "asd" }}',
        },
      },
    ]);

    const res = await action.run(ctx);

    expect(res).toStrictEqual({ foo: 'barasd' });
  });
});
