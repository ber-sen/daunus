import workflow from './index';

import { tineAction } from '../../tineAction';

describe('workflow', () => {
  it('should work for basic example', async () => {
    const action = workflow({
      test: {
        action: ['shape'],
        payload: {
          foo: 'bar',
        },
      },
    });

    const res = await action.run();

    expect(res).toStrictEqual({ foo: 'bar' });
  });

  it('should work with placeholders', async () => {
    const action = workflow({
      test: {
        action: ['shape'],
        payload: {
          foo: 'bar',
        },
      },
      return: {
        action: ['shape'],
        payload: '{{ $.test.foo }}',
      },
    });

    const res = await action.run();

    expect(res).toStrictEqual('bar');
  });

  it('should work with nested workflows', async () => {
    const ctx = new Map();

    ctx.set('.tine-placeholder-resolver', ($: any, key: string) =>
      new Function('$', `return ${key}`)($),
    );

    const action = workflow({
      test: {
        action: ['workflow'],
        payload: {
          lorem: {
            action: ['shape'],
            payload: 'ipsum',
          },
          data: {
            action: ['shape'],
            payload: {
              foo: 'bar',
            },
          },
        },
      },
      return: {
        action: ['shape'],
        payload: {
          foo: '{{ $.test.foo + "asd" }}',
        },
      },
    });

    const res = await action.run(ctx);

    expect(res).toStrictEqual({ foo: 'barasd' });
  });

  it('should allow to add more user defined actions', async () => {
    const ctx = new Map();

    const actions = new Map();

    actions.set('newAction', {
      nested: tineAction(() => ({ data: 'lorem ipsum' }), {
        action: 'newAction',
      }),
    });

    ctx.set('.tine-workflow-actions', actions);

    const action = workflow({
      test: {
        action: ['newAction.nested'],
      },
      return: {
        action: ['shape'],
        payload: '{{ $.test.data }}',
      },
    });

    const res = await action.run(ctx);

    expect(res).toStrictEqual('lorem ipsum');
  });

  it('should work with object', async () => {
    const action = workflow({
      test: {
        action: ['shape'],
        payload: {
          foo: 'bar',
        },
      },
      return: {
        action: ['shape'],
        payload: '{{ $.test }}',
      },
    });

    const res = await action.run();

    expect(res).toStrictEqual({ foo: 'bar' });
  });

  it('should work with top level action', async () => {
    const action = workflow({
      action: ['shape'],
      payload: {
        foo: 'bar',
      },
    });

    const res = await action.run();

    expect(res).toStrictEqual({ foo: 'bar' });
  });

  it('should work with condition action', async () => {
    const ctx = new Map();

    ctx.set('.tine-placeholder-resolver', ($: any, key: string) =>
      new Function('$', `return ${key}`)($),
    );

    const action = workflow({
      data: {
        action: ['shape'],
        payload: 3,
      },
      result: {
        action: ['condition'],
        payload: {
          if: '{{ $.data === 3 }}',
          then: {
            action: ['shape'],
            payload: true,
          },
        },
      },
    });

    const res = await action.run(ctx);

    expect(res).toStrictEqual(true);
  });

  it('should work with response action', async () => {
    const ctx = new Map();

    ctx.set('.tine-workflow-actions-resolver', (name: string) => {
      return tineAction(() => 'test', { action: name });
    });

    const action = workflow({
      action: ['lorem.ipsum.dolor'],
      payload: {
        test: true,
      },
    });

    const res = await action.run(ctx);

    expect(res).toStrictEqual('test');
  });
});
