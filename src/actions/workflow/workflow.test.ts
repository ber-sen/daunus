import workflow from './index';

describe('workflow', () => {
  it('should work for basic example', async () => {
    const action = workflow({
      test: {
        action: 'shape',
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
        action: 'shape',
        payload: {
          foo: 'bar',
        },
      },
      return: {
        action: 'shape',
        payload: '{{ $.test.foo }}',
      },
    });

    const res = await action.run();

    expect(res).toStrictEqual('bar');
  });

  it('should work with nested workflows', async () => {
    const action = workflow({
      test: {
        action: 'workflow',
        payload: {
          lorem: {
            action: 'shape',
            payload: 'ipsum',
          },
          data: {
            action: 'shape',
            payload: {
              foo: 'bar',
            },
          },
        },
      },
      return: {
        action: 'shape',
        payload: {
          foo: '{{ $.test.foo }}',
        },
      },
    });

    const res = await action.run();

    expect(res).toStrictEqual({ foo: 'bar' });
  });
});
