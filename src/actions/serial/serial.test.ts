import serial from './index';

import { tineCtx } from '../../tineHelpers';

describe('serial', () => {
  it('should work with two actions', async () => {
    const action = serial([
      {
        name: 'test',
        type: ['struct'],
        params: {
          foo: 'bar',
        },
      },
      {
        type: ['struct'],
        params: 'test',
      },
    ]);

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual([{ foo: 'bar' }, 'test']);
  });

  it('should work with with nested serial', async () => {
    const action = serial([
      {
        name: 'test',
        type: ['serial'],
        params: [
          {
            type: ['struct'],
            params: 'action.1.1',
          },
          {
            type: ['struct'],
            params: 'action.1.2',
          },
        ],
      },
      {
        type: ['struct'],
        params: 'action.2',
      },
    ]);

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual([['action.1.1', 'action.1.2'], 'action.2']);
  });

  it('should be able to access return of the first action from the second', async () => {
    const action = serial([
      {
        name: 'test',
        type: ['struct'],
        params: {
          foo: 'bar',
        },
      },
      {
        type: ['struct'],
        params: '{{ $.test.data }}',
      },
    ]);

    const res = await action.run(tineCtx());

    expect(res.data).toStrictEqual([{ foo: 'bar' }, { foo: 'bar' }]);
  });
});
