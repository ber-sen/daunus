import parallel from './index';

describe('parallel', () => {
  it('should work with two actions', async () => {
    const action = parallel([
      {
        name: 'test',
        action: ['shape'],
        payload: {
          foo: 'bar',
        },
      },
      {
        action: ['shape'],
        payload: 'test',
      },
    ]);

    const res = await action.run();

    expect(res).toStrictEqual([{ foo: 'bar' }, 'test']);
  });

  it('should work with with nested parallel', async () => {
    const action = parallel([
      {
        name: 'test',
        action: ['parallel'],
        payload: [
          {
            action: ['shape'],
            payload: 'action.1.1',
          },
          {
            action: ['shape'],
            payload: 'action.1.2',
          },
        ],
      },
      {
        action: ['shape'],
        payload: 'action.2',
      },
    ]);

    const res = await action.run();

    expect(res).toStrictEqual([['action.1.1', 'action.1.2'], 'action.2']);
  });
});
