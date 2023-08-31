import serial from './index';

describe('serial', () => {
  it('should work with two actions', async () => {
    const action = serial([
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

  it('should work with with nested serial', async () => {
    const action = serial([
      {
        name: 'test',
        action: ['serial'],
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
