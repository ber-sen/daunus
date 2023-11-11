import workflow from './index';

import { tineAction } from '../../tineAction';

describe('workflow', () => {
  it('should work for basic example', async () => {
    const action = workflow({
      test: {
        type: ['shape'],
        params: {
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
        type: ['shape'],
        params: {
          foo: 'bar',
        },
      },
      return: {
        type: ['shape'],
        params: '{{ $.test.foo }}',
      },
    });

    const res = await action.run();

    expect(res).toStrictEqual('bar');
  });

  it('should allow to add more user defined actions', async () => {
    const ctx = new Map();

    const actions = new Map();

    actions.set('newAction', {
      nested: tineAction(
        {
          type: 'newAction',
        },
        () => ({ data: 'lorem ipsum' }),
      ),
    });

    ctx.set('.tine-workflow-actions', actions);

    const action = workflow({
      test: {
        type: ['newAction.nested'],
      },
      return: {
        type: ['shape'],
        params: '{{ $.test.data }}',
      },
    });

    const res = await action.run(ctx);

    expect(res).toStrictEqual('lorem ipsum');
  });

  it('should work with object', async () => {
    const action = workflow({
      test: {
        type: ['shape'],
        params: {
          foo: 'bar',
        },
      },
      return: {
        type: ['shape'],
        params: '{{ $.test }}',
      },
    });

    const res = await action.run();

    expect(res).toStrictEqual({ foo: 'bar' });
  });

  it('should work with top level action', async () => {
    const action = workflow({
      type: ['shape'],
      params: {
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
        type: ['shape'],
        params: 3,
      },
      result: {
        type: ['condition'],
        params: {
          if: '{{ $.data === 3 }}',
          then: {
            type: ['shape'],
            params: true,
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
      return tineAction({ type: name }, () => 'test');
    });

    const action = workflow({
      type: ['lorem.ipsum.dolor'],
      params: {
        test: true,
      },
    });

    const res = await action.run(ctx);

    expect(res).toStrictEqual('test');
  });
});
